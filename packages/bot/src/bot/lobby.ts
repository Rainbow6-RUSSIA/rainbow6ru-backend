import { Guild, Lobby, User } from '@r6ru/db';
import { IngameStatus as IS, LobbyStoreStatus as LSS, ONLINE_TRACKER, RANKS, VERIFICATION_LEVEL} from '@r6ru/types';
import { CategoryChannel, Collection, GuildMember, Message, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '..';
import bot from '../bot';
import Ratelimiter from '../utils/decorators/ratelimiter';
import WaitLoaded from '../utils/decorators/wait_loaded';
import embeds from '../utils/embeds';
import ENV from '../utils/env';
import { LSBase } from '../utils/lobby_utils';
import Sync from '../utils/sync';

const { Op } = Sequelize;
const initiatedAt = new Date();

export class LobbyStore extends LSBase {

    public constructor(id: Snowflake, type: string, dbGuild: Guild) {
        super();
        this.generateLobby = this.generateLobby.bind(this); // СУКА БЛЯДСКИЙ КОНТЕКСТ ОТВАЛИЛСЯ
        this.atomicJoin = this.atomicJoin.bind(this);
        this.atomicLeave = this.atomicLeave.bind(this);
        this.openLobby = this.openLobby.bind(this);
        this.closeLobby = this.closeLobby.bind(this);
        this.checkLobbyHealth = this.checkLobbyHealth.bind(this);
        (async () => {
            this.guild = dbGuild;
            this.actionCounter = new Collection();
            this.categoryId = id;
            this.category = await bot.channels.fetch(this.categoryId) as CategoryChannel;
            this.type = type;
            this.roomsRange = this.guild.roomsRange[this.type] || this.guild.roomsRange.default;
            this.staticRooms = this.roomsRange[0] === this.roomsRange[1];
            this.lfgChannelId = dbGuild.lfgChannels[this.type];
            this.lfgChannel = await bot.channels.fetch(this.lfgChannelId) as TextChannel;

            this.roomSize = this.rawVoices
                .map(v => v.userLimit)
                .reduce((acc, val) => {
                    acc.has(val) ? acc.get(val).times++ : acc.set(val, { times: 1});
                    return acc;
                }, new Collection<number, { times: number }>())
                .sort((a, b) => a.times - b.times)
                .lastKey();

            await this.lfgChannel.messages.fetch({ limit: 100 });
            await this.lfgChannel.bulkDelete(this.lfgChannel.messages.filter(m => (m.createdTimestamp > (Date.now() - 13 * 24 * 60 * 60 * 1000)) && (m.author.bot || !m.member.hasPermission('MANAGE_ROLES'))));
            if (this.lfgChannel.type === 'text') {
                const loadingMsg = await this.lfgChannel.send('Лобби загружаются, подождите минутку') as Message;
                const voices = this.rawVoices.sort((a, b) => b.members.size - a.members.size).array();
                const cond = (v, i, a) => i >= this.roomsRange[0] && !v.members.size && i !== a.length;
                const toDelete = voices.filter((...args) => cond(...args));

                const rest = voices.filter((...args) => !cond(...args));
                if (rest[0].members.size !== 0 && toDelete.length) {
                    rest.push(toDelete.pop());
                }
                await Promise.all(toDelete.map(v => v.delete()));
                await this.category.fetch();
                if (!this.rawVoices.some(v => v.members.size === 0)) {
                    const channelToClone = await this.rawVoices.last();
                    await channelToClone.clone({ name: channelToClone.name.replace(/#\d+/g, `#${this.rawVoices.size + 1}`), userLimit: this.roomSize });
                    await this.category.fetch();
                }
                const generatedLobbies = await Promise.all(this.rawVoices.map(this.generateLobby));
                this.lobbies = new Collection(generatedLobbies.filter(Boolean).map(l => [l.channel, l]));
                this.status = LSS.AVAILABLE;
                // await this.syncChannels();
                await loadingMsg.delete();
                await debug.warn(`${this.lfgChannel.guild.name} ${this.type} VOICES ${this.rawVoices.size} LOBBIES ${this.lobbies.size} ROOMS RANGE ${this.roomsRange} STATUS ${LSS[this.status]}`);

                setInterval(this.watchActions, 500);
                setInterval(this.purgeActions, 10000);
                setInterval(this.syncChannels, 5 * 60 * 1000);
    }
        })();
    }

    public uniqueUsers = new Set<Snowflake>();
    public loadedAt = new Date();

    public syncChannels = () => Promise.all(this.lobbies.map(l => l.dcChannel).filter(v => !v.deleted).sort((a, b) => a.position - b.position).map((v, i) => {
        const name = v.name.replace(/#\d+/g, _ => `#${i + 1}`);
        return v.name !== name ? v.setName(name) : v;
    }))

    public async kick(member: GuildMember, timeout: number = 10000, reason?: string, lobbyId?: number) {
        await member.voice.setChannel(null, reason);
        try {
            await member.send(reason);
        } catch (err) {
            await this.lfgChannel.send(`${member}, ${reason}`);
        }
        if (timeout > 10000) {
            await member.roles.set(member.roles.filter(r => ![...Object.values(this.guild.platformRoles), ...Object.values(this.guild.rankRoles)].includes(r.id)));
            debug.log(`${member} исключен из \`${this.type}\` на ${humanizeDuration(timeout, {conjunction: ' и ', language: 'ru', round: true})} по причине "${reason}". ${lobbyId ? `ID пати ${lobbyId}` : ''}`);
            setTimeout(async () => Sync.updateMember(this.guild, await User.findByPk(member.id)), timeout);
        }
    }

    // @Atomic
    public async handleForceLeave(id: Snowflake) {
        console.log('FORCE LEAVE');
        const lobby = this.lobbies.find(l => Boolean(l.members.find(m => m.id === id)));
        if (lobby) {
            await this.checkLobbyHealth(lobby);
            if (lobby.dcChannel.members.size === 0 && this.lobbies.size > this.roomsRange[0]) {
                await this.closeLobby(lobby);
            }
        }
    }

    @Ratelimiter
    @WaitLoaded
    // @Atomic
    public async join(member: GuildMember, to: VoiceChannel) {
        // console.log('JOIN');
        const lobby = this.lobbies.get(to.id);
        if (!lobby) {return; }
        if (to.members.size === 1 && this.lobbies.size <= this.roomsRange[1]) {
            lobby.dcLeader = member;
            if (!this.staticRooms || this.voices.size < this.roomsRange[0]) {
                await this.openLobby(lobby);
            }
        }
        await this.atomicJoin(member, lobby);
        await this.checkLobbyHealth(lobby);
    }

    @Ratelimiter
    @WaitLoaded
    // @Atomic
    public async leave(member: GuildMember, from: VoiceChannel) {
        // console.log('LEAVE');
        const lobby = this.lobbies.get(from.id);
        if (!lobby) {return; }
        await this.atomicLeave(member, lobby);
        if (from.members.size === 0) {
            if (this.staticRooms) {
                this.lobbies.delete(lobby.channel);
                this.lobbies.set(from.id, await this.generateLobby(from));
                return;
            }
            if (this.lobbies.size > this.roomsRange[0]) {
                return this.closeLobby(lobby);
            }
        } else {
            return this.checkLobbyHealth(lobby);
        }
    }

    @Ratelimiter
    @WaitLoaded
    // @Atomic
    public async internal(member: GuildMember, from: VoiceChannel, to: VoiceChannel) {
        const lobbyFrom = this.lobbies.get(from.id);
        const lobbyTo = this.lobbies.get(to.id);
        if (lobbyFrom) {
            await this.atomicLeave(member, lobbyFrom);
        }
        if (lobbyTo) {
            await this.atomicJoin(member, lobbyTo);
        }
        if (lobbyFrom) {
            await this.checkLobbyHealth(lobbyFrom);
        }
        if (lobbyTo) {
            await this.checkLobbyHealth(lobbyTo);
        }
    }

    public refreshIngameStatus = async (lobby: Lobby) => {
        const statuses = lobby.dcChannel.members.map(m => LobbyStore.detectIngameStatus(m.presence)).filter(is => is !== IS.OTHER);
        statuses.unshift(IS.OTHER);
        const s = lobby.status;
        lobby.status = statuses.reduce((acc, el) => {
            acc.k[el] = acc.k[el] ? acc.k[el] + 1 : 1;
            acc.max = acc.max ? acc.max < acc.k[el] ? el : acc.max : el;
            return acc;
          }, { k: {}, max: null }).max;
        if (s !== lobby.status && ![s, lobby.status].includes(IS.OTHER)) {
            const start = [[IS.CASUAL_SEARCH, IS.CASUAL], [IS.RANKED_SEARCH, IS.RANKED]];
            const stop = [[IS.CASUAL, IS.MENU], [IS.RANKED, IS.MENU]];
            if (stop.some(t => JSON.stringify(t) === JSON.stringify([s, lobby.status]))) {
                debug.log(`<@${lobby.members.map(m => m.id).join('>, <@')}> закончили играть (\`${IS[s]} --> ${IS[lobby.status]}\`). ID пати \`${lobby.id}\``);
            }
            if (start.some(t => JSON.stringify(t) === JSON.stringify([s, lobby.status]))) {
                debug.log(`<@${lobby.members.map(m => m.id).join('>, <@')}> начали играть (\`${IS[s]} --> ${IS[lobby.status]}\`). ID пати \`${lobby.id}\``);
            }
        }
    }

    @WaitLoaded
    public async reportIngameStatus(member: GuildMember, status: IS) {
        // console.log(member.user.tag, IngameStatus[status]);
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
        try {
            await voice.edit({
                name: voice.name.replace(/HardPlay /g, '').replace(/#\d+/g, `#${voice.position + 1}`),
                permissionOverwrites: voice.parent.permissionOverwrites,
                userLimit: this.roomSize,
            }, 'инициализация комнаты');

            const lobby = new Lobby({
                channel: voice.id,
                hardplay: false,
                initiatedAt,
                open: true,
                type: this.type,
            });

            lobby.dcCategory = this.category;
            lobby.dcChannel = voice;
            lobby.dcGuild = voice.guild;
            lobby.dcLeader = voice.members.random();

            await lobby.save();
            await lobby.$set('guild', this.guild);
            await lobby.$set('members', await User.findAll({ where: { id: lobby.dcChannel.members.map(m => m.id) } }));
            await lobby.reload({ include: [{all: true}] });
            this.uniqueUsers = new Set([...this.uniqueUsers, ...lobby.members.map(m => m.id)]);

            if (lobby.dcLeader) {
                // const dbUser = await User.findByPk(lobby.dcLeader.id, { include: [Lobby] });
                // console.log(dbUser);
                // if (dbUser.lobby) {
                //     console.log(dbUser.lobby);
                //     lobby.description = dbUser.lobby.description;
                // }
                const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE)});
                lobby.invite = inv.url;
                lobby.dcInvite = inv;
                await lobby.save();
                lobby.appealMessage = await this.lfgChannel.send('', await embeds.appealMsg(lobby)) as Message;
            }

            return lobby;

        } catch (err) {
            console.log(err);
            return null;
        }
    }

    private async checkLobbyHealth(lobby: Lobby) {
        try {
            if (!this.rawVoices.some((v: VoiceChannel) => v.members.size === 0) && !this.staticRooms) {
                console.log('adding new channel due error');
                this.openLobby(lobby);
            }
            await lobby.dcChannel.fetch();
            if (lobby.members.length !== lobby.dcChannel.members.size) {
                await lobby.$set('members', await User.findAll({ where: { id: lobby.dcChannel.members.map(m => m.id) } }));
                await lobby.reload({ include: [{all: true}] });
                if (lobby.members.length !== lobby.dcChannel.members.size) {
                    await Promise.all(lobby.dcChannel.members.filter(m => !Boolean(lobby.members.find(dbm => dbm.id === m.id))).map(m => this.kick(m, 10000, 'Требуется регистрация. Используйте `$rank ваш_Uplay` в канале для команд бота.')));
                    await this.checkLobbyHealth(lobby);
                }
            }
            if (lobby.dcLeader) {
                if (lobby.dcChannel.members.size === 0) {
                    lobby.dcLeader = null;
                } else if (!lobby.dcChannel.members.has(lobby.dcLeader.id)) {
                    lobby.dcLeader = lobby.dcChannel.members.random();
                }
            }
        } catch (err) {
            console.log('LOBBY CACHE MISS', err);
            await this.lobbies.delete(lobby.channel);
        }
    }

    public async updateAppealMsg(lobby: Lobby) {
        if (lobby.appealMessage) {
            if (lobby.dcInvite.expiresTimestamp < Date.now()) {
                try {
                    await lobby.appealMessage.delete();
                } catch (err) {
                    console.log('idgaf 1');
                }
                return lobby.appealMessage = null;
            }
            lobby.dcChannel = await lobby.dcChannel.fetch() as VoiceChannel;
            try {
                await lobby.appealMessage.edit('', await embeds.appealMsg(lobby));
            } catch (err) {
                console.log('pre idgaf 2');
                try {
                    await this.lfgChannel.messages.fetch(lobby.appealMessage.id, false)
                        .finally(this.lfgChannel.messages.get(lobby.appealMessage.id).delete);
                } catch (err) {
                    console.log('idgaf 2');
                }

            // return lobby.appealMessage = await this.lfgChannel.send('', await embeds.appealMsg(lobby)) as Message;
            }
        }
    }

    private async openLobby(lobby: Lobby) {
        const channelToClone = this.rawVoices.last();
        const clonedChannel = await channelToClone.clone({ name: channelToClone.name.replace(/#\d+/g, `#${this.rawVoices.size + 1}`), userLimit: this.roomSize }) as VoiceChannel;
        this.lobbies.set(clonedChannel.id, await this.generateLobby(clonedChannel));
    }

    private async closeLobby(lobby: Lobby) {
        lobby.active = false;
        await lobby.save();

        const toDelete = lobby.dcChannel; // this.voices.get(lobby.channel);
        const toMove = this.voices.sort((a, b) => a.position - b.position).last();
        const pos = toDelete.position;
        // await Promise.all([
        await toMove.edit({
            name: toDelete.name.replace('HardPlay ', '').replace(/#\d+/g, `#${pos + 1}`),
            position: pos,
        }, 'подмена закрытого канала');
        await toDelete.delete();
        // ]);
        // toDelete.deleted = true; // наеб блядского кэша discord.js
        // // await this.syncChannels();
        this.lobbies.delete(lobby.channel);
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

    private async atomicLeave(member: GuildMember, lobby: Lobby) {
        const dbUser = await User.findByPk(member.id);
        await lobby.$remove('members', dbUser);

        if (Math.random() < parseFloat(ENV.QR_CHANCE) && dbUser.verificationLevel < VERIFICATION_LEVEL.QR && dbUser.platform.PC) {
            dbUser.requiredVerification = VERIFICATION_LEVEL.QR;
            await dbUser.save();
            Sync.updateMember(await Guild.findByPk(member.guild.id), dbUser);
            debug.log(`автоматически запрошена верификация аккаунта <@${dbUser.id}> ${ONLINE_TRACKER}${dbUser.genome} после выхода из лобби`);
        }

        await lobby.reload({include: [{all: true}]});
        if (!lobby.open) {
            lobby.open = true;
            await lobby.dcChannel.setUserLimit(this.roomSize);
        }
        if (!lobby.dcChannel.members.size) {
            lobby.dcLeader = null;
        }
        if (lobby.dcChannel.members.size !== 0 && member.id === lobby.dcLeader.id) {
            const newLeader = lobby.dcChannel.members.random();
            // debug.log(`Лидер ${lobby.dcLeader} покинул комнату. Новый лидер - ${newLeader}. Через комнату прошли <@${lobby.log.join('>, <@')}>. ID пати \`${lobby.id}\``);
            // lobby.log = [];
            lobby.open = true;
            lobby.hardplay = false;
            this.handleHardplay(lobby);
            try {
                newLeader.send('Теперь Вы - лидер лобби');
            } catch (error) {
                (await this.lfgChannel.send(`${newLeader}, теперь Вы - лидер лобби`) as Message).delete({ timeout: 30000 });
            }
            lobby.dcLeader = newLeader;
        }
        await lobby.save();
        if (lobby.dcChannel.members.size) {
            await this.refreshIngameStatus(lobby);
            return this.updateAppealMsg(lobby);
        } else {
            if (lobby.appealMessage) {
                try {
                    await (await this.lfgChannel.messages.fetch(lobby.appealMessage.id)).delete();
                } catch (error) {
                    console.log('idgaf');
                }
                lobby.appealMessage = null;
            }
            return;
        }
    }

    private async atomicJoin(member: GuildMember, lobby: Lobby) {
        const dbUser = await User.findByPk(member.id);
        // if (lobby.hardplay && dbUser.rank < lobby.limitRank) {
        //     return this.kick(member, 0, `Это лобби доступно только для \`${RANKS[lobby.limitRank]}\` и выше!`, lobby.id);
        // }
        this.uniqueUsers.add(dbUser.id);
        await lobby.$add('members', dbUser);
        await lobby.reload({include: [{all: true}]});
        if (!lobby.dcLeader) {
            lobby.dcLeader = member;
        }
        if (lobby.dcChannel.members.size >= this.roomSize && !lobby.appealMessage) {
            const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE) });
            lobby.invite = inv.url;
            await lobby.save();
            lobby.dcInvite = inv;
            lobby.appealMessage = await this.lfgChannel.send('', await embeds.appealMsg(lobby)) as Message;
        } else {
            await this.updateAppealMsg(lobby);
        }
        await this.refreshIngameStatus(lobby);
    }

    public async handleHardplay(lobby: Lobby) {
        const vc = lobby.dcChannel;
        if (lobby.hardplay) {
            const HP = vc.name.replace(' ', ' HardPlay ');
            const allRoles = new Set(this.guild.rankRoles);
            const allowedRoles = new Set(this.guild.rankRoles.slice(lobby.minRank));
            allRoles.delete(''); allowedRoles.delete('');
            const disallowedRoles = new Set([...allRoles].filter(r => !allowedRoles.has(r)));
            // console.log({allRoles, allowedRoles, disallowedRoles});
            return vc.edit({
                name: /HardPlay /g.test(HP) ? HP : vc.name.replace('', 'HardPlay '),
                permissionOverwrites: vc.permissionOverwrites.filter(o => !disallowedRoles.has(o.id)),
            });
        } else {
            return vc.edit({
                name: vc.name.replace(/HardPlay /g, ''),
                permissionOverwrites: vc.parent.permissionOverwrites,
            });
        }
    }
}

export const lobbyStores: Collection<Snowflake, LobbyStore> = new Collection();

export async function initLobbyStores() {
    if (ENV.LOBBY_MODE !== 'off') {
        debug.warn('Lobbies ' + ENV.LOBBY_MODE);
    } else {
        return debug.warn('Lobbies ' + ENV.LOBBY_MODE);
    }
    const dbGuilds = await Guild.findAll({ where: { premium: true } });
    dbGuilds.map(g => {
        Object.entries(g.voiceCategories).map(ent => lobbyStores.set(ent[1], new LobbyStore(ent[1], ent[0], g)));
    });
    const lobbies = await Lobby.findAll({
        where: {
            [Op.and]: [
                {initiatedAt: {[Op.lt]: initiatedAt}},
                {active: true},
            ],
        },
    });
    await Promise.all(lobbies.map(l => {
        l.active = false;
        return l.save();
    }));
}
