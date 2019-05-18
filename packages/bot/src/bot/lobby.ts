import { Guild, Lobby, User } from '@r6ru/db';
import { IActivityCounter, IngameStatus, LobbyStoreStatus as LSS } from '@r6ru/types';
import { CategoryChannel, GuildMember, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '..';
import bot from '../bot';
import embeds from '../utils/embeds';
import ENV from '../utils/env';
import { Atomic, LSBase, Ratelimiter, WaitLoaded } from '../utils/lobby_utils';

const { Op } = Sequelize;
const initiatedAt = new Date();

export class LobbyStore extends LSBase {

    public constructor(id: Snowflake, type: string, dbGuild: Guild) {
        super();
        this.generateLobby = this.generateLobby.bind(this); // СУКА БЛЯДСКИЙ КОНТЕКСТ ОТВАЛИЛСЯ
        (async () => {
            this.guild = dbGuild;
            this.events = [];
            this.categoryId = id;
            this.category = await bot.channels.fetch(this.categoryId) as CategoryChannel;
            this.type = type;
            this.lfgChannelId = dbGuild.lfgChannels[this.type];
            this.lfgChannel = await bot.channels.fetch(this.lfgChannelId) as TextChannel;
            if (this.lfgChannel.type === 'text') {
                const voices = (this.category.children.filter((ch) => ch.type === 'voice').array() as VoiceChannel[]).sort((a, b) => b.members.size - a.members.size); // .sort((a, b) => a.position - b.position) as VoiceChannel[];
                const cond = (v, i, a) => i >= this.guild.roomsRange[0] && !v.members.size && i !== a.length;
                const toDelete = voices.filter((...args) => cond(...args));
                const rest = voices.filter((...args) => !cond(...args));
                if (rest[0].members.size !== 0 && toDelete.length) {
                    rest.push(toDelete.pop());
                }
                await Promise.all(toDelete.map((v) => v.delete()));
                this.voices = rest.sort((a, b) => a.position - b.position);
                this.lobbies = await Promise.all(this.voices.map(this.generateLobby));
                this.status = LSS.AVAILABLE;
                await this.syncChannels();
                console.log(this.lfgChannel.guild.name, 'VOICES', this.voices.length, 'LOBBIES', this.lobbies.length, 'ROOMS RANGE', this.guild.roomsRange);
                console.log(this.lfgChannel.guild.name, 'STATUS', LSS[this.status]);

                setInterval(this.watchEvents, 500);
                setInterval(() => this.events.pop(), 10000);
    }
        })();
    }

    public syncChannels = () => Promise.all(this.voices.filter(Boolean).filter((v) => !v.deleted).sort((a, b) => a.position - b.position).map((v, i) => v.setName(v.name.replace(/\d+/g, (_) => (i + 1).toString()))));

    public async kick(member: GuildMember) {
        console.log('soon™');
    }

    @Ratelimiter('join')
    @WaitLoaded
    @Atomic
    public async join(member: GuildMember, to: VoiceChannel) {
        const lobby = this.lobbies.find((l) => l.channel === to.id);
        if (to.members.size === 1 && this.voices.length <= this.guild.roomsRange[1]) {
            lobby.dcLeader = member;
            const channelToClone = this.voices[this.voices.length - 1];
            await channelToClone.fetch();
            let clonedChannel = null;
            try {
                clonedChannel = await channelToClone.clone({ name: channelToClone.name.replace(/\d+/g, (n) => (parseInt(n) + 1).toString()) }) as VoiceChannel;
            } catch (err) {
                err.stack = (new Error('channelToClone.clone() 66:59')).stack;
                debug.error(err, 'BOT');
            }
            this.voices.push(clonedChannel);
            this.lobbies.push(await this.generateLobby(clonedChannel));
        }
        await this.atomicJoin(member, lobby);
    }

    @Ratelimiter('leave')
    @WaitLoaded
    @Atomic
    public async leave(member: GuildMember, from: VoiceChannel) {
        const lobby = this.lobbies.find((l) => l.channel === from.id);
        await this.atomicLeave(member, lobby);
        if (from.members.size === 0 && this.voices.length > this.guild.roomsRange[0]) {
            const k = this.lobbies.findIndex((l) => l.dcChannel === from);
            lobby.active = false;
            await lobby.save();
            this.lobbies.splice(k, 1);

            const j = this.voices.findIndex((v) => v === from);
            this.voices.splice(j, 1);
            try {
                await (!from.deleted && from.delete());
            } catch (err) {
                err.stack = (new Error('from.delete() 86:36')).stack;
                debug.error(err, 'BOT');
            }
            try {
                await this.syncChannels();
            } catch (err) {
                err.stack = (new Error('this.syncChannels() 92:42')).stack;
                debug.error(err, 'BOT');
            }
        }
    }

    @Ratelimiter('move')
    @WaitLoaded
    @Atomic
    public async internal(member: GuildMember, from: VoiceChannel, to: VoiceChannel) {
        const lobbyFrom = this.lobbies.find((l) => l.channel === from.id);
        const lobbyTo = this.lobbies.find((l) => l.channel === to.id);
        await this.atomicLeave(member, lobbyFrom);
        await this.atomicJoin(member, lobbyTo);
    }

    public refreshIngameStatus = async (lobby: Lobby) => {
        const statuses = lobby.dcChannel.members.array().map((m) => LobbyStore.detectIngameStatus(m.presence)).filter((s) => s !== IngameStatus.OTHER);
        statuses.unshift(IngameStatus.OTHER);
        // console.log(statuses);
        lobby.status = lobby.status = statuses.reduce((acc, el) => {
            acc.k[el] = acc.k[el] ? acc.k[el] + 1 : 1;
            acc.max = acc.max ? acc.max < acc.k[el] ? el : acc.max : el;
            return acc;
          }, { k: {}, max: null }).max;
    }

    @WaitLoaded
    public async reportIngameStatus(member: GuildMember, status: IngameStatus) {
        console.log(member.user.tag, IngameStatus[status]);
        const lobby = this.lobbies.find((l) => l.channel === member.voice.channelID);
        const s = lobby.status;
        await this.refreshIngameStatus(lobby);
        if (lobby.status !== s) {
            this.updateAppealMsg(lobby);
        }
    }

    private updateAppealMsg = async (lobby: Lobby) => {
        if (lobby.appealMessage) {
            if (lobby.dcInvite.expiresTimestamp < Date.now()) {
                return (!lobby.appealMessage.deleted && lobby.appealMessage.delete());
            }
            try {
                return lobby.appealMessage.edit('@here', await embeds.appealMsg(lobby));
            } catch (err) {
                return this.lfgChannel.send('@here', await embeds.appealMsg(lobby));
            }
        }
    }

    // @Atomic
    public async generateLobby(voice: VoiceChannel) {
        if (!voice) {
            return null;
        }
        const members = [...voice.members.values()];
        const lobby = new Lobby({
            channel: voice.id,
            initiatedAt,
            type: this.type,
        }).init({
            dcCategory: this.category,
            dcChannel: voice,
            dcGuild: voice.guild,
            dcLeader: members[Math.floor(Math.random() * members.length)],
            dcMembers: members,
        });
        await lobby.save();
        await lobby.$set('guild', this.guild);
        await lobby.$set('members', await User.findAll({ where: { id: lobby.dcMembers.map((m) => m.id) } }));
        await lobby.reload({ include: [{all: true}] });
        return lobby;
    }

    private watchEvents = () => {
        const grouppedByMember = this.events
            .reduce((a: IActivityCounter[], b) => {
                const i = a.findIndex((x) => x.id === b.member.id);
                i === -1 ? a.push({ id : b.member.id, times : 1 }) : a[i].times++;
                return a;
            }, []);
        // const grouppedByLeave = this.events
        //     .filter((e) => e.type === 'leave')
        //     .reduce((a: IActivityCounter[], b) => {
        //         const i = a.findIndex((x) => x.id === b.voice.id);
        //         i === -1 ? a.push({ id : b.voice.id, times : 1 }) : a[i].times++;
        //         return a;
        //     }, []);
        // console.log('watchEvents', grouppedByMember);
        switch (true) {
            case true: {
                break;
            }
            default:
                break;
        }
    }

    private atomicLeave = async (member: GuildMember, lobby: Lobby) => {
        await lobby.$remove('members', await User.findByPk(member.id));
        await lobby.reload({include: [{all: true}]});
        lobby.dcMembers = lobby.dcMembers.filter((m) => m.id !== member.id);
        if (!lobby.dcMembers.length) {
            lobby.dcLeader = null;
        }
        if (lobby.dcChannel.members.size !== 0 && member.id === lobby.dcLeader.id) {
            console.log(lobby.dcLeader.user.tag, lobby.log);
            lobby.log = [];
            await lobby.save();
            const newLeader = lobby.dcMembers[Math.floor(Math.random() * lobby.dcMembers.length)];
            newLeader.send('теперь Вы - лидер лобби');
            lobby.dcLeader = newLeader;
            console.log('leader left');
        }
        if (lobby.dcMembers.length) {
            await this.refreshIngameStatus(lobby);
            await this.updateAppealMsg(lobby);
        } else {
            await (lobby.appealMessage && !lobby.appealMessage.deleted && lobby.appealMessage.delete());
        }
    }

    private atomicJoin = async (member: GuildMember, lobby: Lobby) => {
        await lobby.$add('members', await User.findByPk(member.id));
        await lobby.reload({include: [{all: true}]});
        if (!lobby.dcLeader) {
            lobby.dcLeader = member;
        }
        lobby.dcMembers.push(member);
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
