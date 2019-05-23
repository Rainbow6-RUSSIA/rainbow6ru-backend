import { Guild, Lobby, User } from '@r6ru/db';
import { IngameStatus, LobbyStoreStatus as LSS, RANKS } from '@r6ru/types';
import { CategoryChannel, Collection, GuildMember, Message, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '..';
import bot from '../bot';
import Atomic from '../utils/decorators/atomic';
import Ratelimiter from '../utils/decorators/ratelimiter';
import WaitLoaded from '../utils/decorators/wait_loaded';
import embeds from '../utils/embeds';
import ENV from '../utils/env';
import { LSBase } from '../utils/lobby_utils';
import { syncMember } from '../utils/sync';

const { Op } = Sequelize;
const initiatedAt = new Date();

export class LobbyStore extends LSBase {

    public constructor(id: Snowflake, type: string, dbGuild: Guild) {
        super();
        this.generateLobby = this.generateLobby.bind(this); // СУКА БЛЯДСКИЙ КОНТЕКСТ ОТВАЛИЛСЯ
        (async () => {
            this.guild = dbGuild;
            this.actionCounter = new Collection();
            this.categoryId = id;
            this.category = await bot.channels.fetch(this.categoryId) as CategoryChannel;
            this.type = type;
            this.lfgChannelId = dbGuild.lfgChannels[this.type];
            this.lfgChannel = await bot.channels.fetch(this.lfgChannelId) as TextChannel;
            await this.lfgChannel.messages.fetch();
            await this.lfgChannel.bulkDelete(this.lfgChannel.messages.filter((m) => m.author.id === bot.user.id));
            if (this.lfgChannel.type === 'text') {
                const voices = (this.category.children.filter((ch) => ch.type === 'voice').array() as VoiceChannel[]).sort((a, b) => b.members.size - a.members.size); // .sort((a, b) => a.position - b.position) as VoiceChannel[];
                const cond = (v, i, a) => i >= this.guild.roomsRange[0] && !v.members.size && i !== a.length;
                const toDelete = voices.filter((...args) => cond(...args));
                const rest = voices.filter((...args) => !cond(...args));
                if (rest[0].members.size !== 0 && toDelete.length) {
                    rest.push(toDelete.pop());
                }
                await Promise.all(toDelete.map((v) => v.delete()));
                await this.category.fetch();
                // this.voices = rest.sort((a, b) => a.position - b.position);
                const generatedLobbies = await Promise.all(this.voices.map(this.generateLobby));
                this.lobbies = new Collection(generatedLobbies.map((l) => [l.channel, l]));
                this.status = LSS.AVAILABLE;
                await this.syncChannels();
                console.log(this.lfgChannel.guild.name, 'VOICES', this.voices.size, 'LOBBIES', this.lobbies.size, 'ROOMS RANGE', this.guild.roomsRange);
                console.log(this.lfgChannel.guild.name, 'STATUS', LSS[this.status]);

                setInterval(this.watchActions, 500);
                setInterval(this.purgeActions, 10000);
    }
        })();
    }

    public syncChannels = () => Promise.all(this.voices.array().sort((a, b) => a.position - b.position).map((v, i) => v.setName(v.name.replace(/\d+/g, (_) => (i + 1).toString()))));

    public async kick(member: GuildMember, timeout: number = 10000, reason?: string) {
        await member.voice.setChannel(null, reason);
        try {
            await member.send(reason);
        } catch (error) {
            await this.lfgChannel.send(`${member}, ${reason}`);
        }
        if (timeout > 1000) {
            await member.roles.set(member.roles.filter((r) => ![...Object.values(this.guild.platformRoles), ...Object.values(this.guild.rankRoles)].includes(r.id)));
            debug.log(`${member} исключен из \`${this.type}\` на ${humanizeDuration(timeout, {conjunction: ' и ', language: 'ru', round: true})} по причине "${reason}"`);
            setTimeout(async () => syncMember(this.guild, await User.findByPk(member.id)), timeout);
        }
    }

    @Atomic
    public async handleForceLeave(id: Snowflake) {
        const lobby = this.lobbies.find((l) => Boolean(l.members.find((m) => m.id === id)));
        if (lobby) {
            this.checkLobbyHealth(lobby);
            if (lobby.dcChannel.members.size === 0 && this.voices.size > this.guild.roomsRange[0]) {
                this.closeLobby(lobby);
            }
        }
    }

    @Ratelimiter
    @WaitLoaded
    @Atomic
    public async join(member: GuildMember, to: VoiceChannel) {
        const lobby = this.lobbies.get(to.id);
        if (to.members.size === 1 && this.voices.size <= this.guild.roomsRange[1]) {
            lobby.dcLeader = member;
            await this.openLobby(lobby);
        }
        await this.atomicJoin(member, lobby);
        await this.checkLobbyHealth(lobby);
    }

    @Ratelimiter
    @WaitLoaded
    @Atomic
    public async leave(member: GuildMember, from: VoiceChannel) {
        const lobby = this.lobbies.get(from.id);
        await this.atomicLeave(member, lobby);
        if (from.members.size === 0 && this.voices.size > this.guild.roomsRange[0]) {
            await this.closeLobby(lobby);
        }
        await this.checkLobbyHealth(lobby);
    }

    @Ratelimiter
    @WaitLoaded
    @Atomic
    public async internal(member: GuildMember, from: VoiceChannel, to: VoiceChannel) {
        const lobbyFrom = this.lobbies.get(from.id);
        const lobbyTo = this.lobbies.get(to.id);
        await this.atomicLeave(member, lobbyFrom);
        await this.atomicJoin(member, lobbyTo);
    }

    public refreshIngameStatus = async (lobby: Lobby) => {
        const statuses = lobby.dcChannel.members.map((m) => LobbyStore.detectIngameStatus(m.presence)).filter((s) => s !== IngameStatus.OTHER);
        statuses.unshift(IngameStatus.OTHER);
        lobby.status = statuses.reduce((acc, el) => {
            acc.k[el] = acc.k[el] ? acc.k[el] + 1 : 1;
            acc.max = acc.max ? acc.max < acc.k[el] ? el : acc.max : el;
            return acc;
          }, { k: {}, max: null }).max;
    }

    @WaitLoaded
    public async reportIngameStatus(member: GuildMember, status: IngameStatus) {
        console.log(member.user.tag, IngameStatus[status]);
        const lobby = this.lobbies.get(member.voice.channelID);
        if (!lobby) { return; }
        const s = lobby.status;
        await this.refreshIngameStatus(lobby);
        if (lobby.status !== s) {
            this.updateAppealMsg(lobby); // добавить логгирование начавшейся катки
        }
    }

    // @Atomic
    public async generateLobby(voice: VoiceChannel) {
        if (!voice) {
            return null;
        }
        const lobby = new Lobby({
            channel: voice.id,
            initiatedAt,
            type: this.type,
        });

        lobby.dcCategory = this.category;
        lobby.dcChannel = voice;
        lobby.dcGuild = voice.guild;
        lobby.dcLeader = voice.members.random();

        await lobby.save();
        await lobby.$set('guild', this.guild);
        await lobby.$set('members', await User.findAll({ where: { id: lobby.dcChannel.members.map((m) => m.id) } }));
        await lobby.reload({ include: [{all: true}] });

        if (lobby.dcLeader) {
            // const dbUser = await User.findByPk(lobby.dcLeader.id, { include: [Lobby] });
            // console.log(dbUser);
            // if (dbUser.lobby) {
            //     console.log(dbUser.lobby);
            //     lobby.description = dbUser.lobby.description;
            // }
            const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE) });
            lobby.invite = inv.url;
            lobby.dcInvite = inv;
            await lobby.save();
            lobby.appealMessage = await this.lfgChannel.send('', await embeds.appealMsg(lobby)) as Message;
        }

        return lobby;
    }

    private async checkLobbyHealth(lobby: Lobby) {
        if (lobby.members.length !== lobby.dcChannel.members.size) {
            await lobby.dcChannel.fetch();
            await lobby.$set('members', await User.findAll({ where: { id: lobby.dcChannel.members.map((m) => m.id) } }));
            await lobby.reload({ include: [{all: true}] });
            if (lobby.members.length === lobby.dcChannel.members.size) {
                await Promise.all(lobby.dcChannel.members.filter((m) => Boolean(lobby.members.find((dbm) => dbm.id === m.id))).map((m) => this.kick(m, 10000, 'Требуется регистрация. Используйте `$rank ваш_Uplay` в канале для команд бота.')));
            }
        }
        if (lobby.dcLeader && !lobby.dcChannel.members.has(lobby.dcLeader.id)) {
            lobby.dcLeader = lobby.dcChannel.members.random();
        }
    }

    private updateAppealMsg = async (lobby: Lobby) => {
        if (lobby.appealMessage) {
            if (lobby.dcInvite.expiresTimestamp < Date.now()) {
                return (!lobby.appealMessage.deleted && lobby.appealMessage.delete());
            }
            try {
                return lobby.appealMessage.edit('', await embeds.appealMsg(lobby));
            } catch (err) {
                return this.lfgChannel.send('', await embeds.appealMsg(lobby));
            }
        }
    }

    private async openLobby(lobby: Lobby) {
        const channelToClone = this.voices.last();
        await this.category.fetch();
        const clonedChannel = await channelToClone.clone({ name: channelToClone.name.replace(/\d+/g, (n) => (parseInt(n) + 1).toString()) }) as VoiceChannel;
        this.lobbies.set(clonedChannel.id, await this.generateLobby(clonedChannel));
    }

    private async closeLobby(lobby: Lobby) {
        lobby.active = false;
        await lobby.save();
        this.lobbies.delete(lobby.channel);

        const toDelete = this.voices.get(lobby.channel);
        toDelete.deleted = true; // наеб блядского кэша discord.js
        await this.syncChannels();
        toDelete.delete();
        await this.category.fetch();
    }

    private watchActions = () => {
        this.actionCounter.forEach(async (a, key, map) => {
            if (!a.kicked && a.times >= parseInt(ENV.KICK_LIMIT)) {
                a.kicked = true;
                return this.kick(a.member, 10000 * a.times, 'Вы временно отстранены от поиска за чрезмерную активность!');
            }
            if (!a.warned && a.times >= parseInt(ENV.KICK_LIMIT) * 0.75) {
                a.warned = true;
                try {
                    a.member.send('Вы совершаете слишком много действий! Умерьте пыл, или вы будете временно отстранены!');
                } catch (error) {
                    (await this.lfgChannel.send(`${a.member}, вы совершаете слишком много действий! Умерьте пыл, или вы будете временно отстранены!`) as Message).delete({ timeout: 30000 });
                }
            }
        });
    }

    private atomicLeave = async (member: GuildMember, lobby: Lobby) => {
        await lobby.$remove('members', await User.findByPk(member.id));
        await lobby.reload({include: [{all: true}]});
        if (!lobby.dcChannel.members.size) {
            lobby.dcLeader = null;
        }
        if (lobby.dcChannel.members.size !== 0 && member.id === lobby.dcLeader.id) {
            console.log(lobby.dcLeader.user.tag, lobby.log);
            lobby.log = [];
            lobby.open = true;
            await lobby.save();
            const newLeader = lobby.dcChannel.members.random();
            try {
                newLeader.send('Теперь Вы - лидер лобби');
            } catch (error) {
                (await this.lfgChannel.send(`${newLeader}, теперь Вы - лидер лобби`) as Message).delete({ timeout: 30000 });
            }
            lobby.dcLeader = newLeader;
            console.log('leader left');
        }
        if (lobby.dcChannel.members.size) {
            await this.refreshIngameStatus(lobby);
            return this.updateAppealMsg(lobby);
        } else {
            return (lobby.appealMessage && !lobby.appealMessage.deleted && lobby.appealMessage.delete());
        }
    }

    private atomicJoin = async (member: GuildMember, lobby: Lobby) => {
        const dbUser = await User.findByPk(member.id);
        const min = Math.min(...lobby.members.map((m) => m.rank));
        if (!lobby.open && dbUser.rank < min) {
            return this.kick(member, 0, `Это лобби доступно только для \`${RANKS[min]}\` и выше!`);
        }
        await lobby.$add('members', dbUser);
        await lobby.reload({include: [{all: true}]});
        if (!lobby.dcLeader) {
            lobby.dcLeader = member;
        }
        await this.refreshIngameStatus(lobby);
        await this.updateAppealMsg(lobby);
    }
}

export const lobbyStores: Map<Snowflake, LobbyStore> = new Map();

export async function initLobbyStores() {
    if (ENV.ENABLE_LOBBIES !== 'true') {
        return debug.warn('Lobbies disabled');
    } else {
        debug.warn('Lobbies enabled');
    }
    const dbGuilds = await Guild.findAll({ where: { premium: true } });
    dbGuilds.map((g) => {
        Object.entries(g.voiceCategories).map((ent) => lobbyStores.set(ent[1], new LobbyStore(ent[1], ent[0], g)));
    });
    const lobbies = await Lobby.findAll({
        where: {
            [Op.and]: [
                {initiatedAt: {[Op.lt]: initiatedAt}},
                {active: true},
            ],
        },
    });
    await Promise.all(lobbies.map((l) => {
        l.active = false;
        return l.save();
    }));
}