import { Guild, Lobby } from '@r6ru/db';
import { ILobbySettings, LobbyStoreStatus as LSS} from '@r6ru/types';
import { CategoryChannel, Collection, GuildMember, Message, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '../..';
import bot from '../../bot';
// import Ratelimiter from '../utils/decorators/ratelimiter';
import WaitLoaded from '../decorators/wait_loaded';
import embeds from '../embeds';
import { LSRoom } from './room';
import { LSBase } from './utils';

const { Op } = Sequelize;
const initiatedAt = new Date();

export class LobbyStore extends LSBase {

    public constructor(settings: ILobbySettings, dbGuild: Guild) {
        super();
        this.openLobby = this.openLobby.bind(this);
        this.closeLobby = this.closeLobby.bind(this);
        // this.checkLobbyHealth = this.checkLobbyHealth.bind(this);
        (async () => {
            this.settings = settings;
            this.guild = dbGuild;
            // this.actionCounter = new Collection();
            this.category = await bot.channels.fetch(settings.voiceCategory) as CategoryChannel;
            this.roomsRange = this.settings.roomsRange || [5, 10];
            this.staticRooms = this.roomsRange[0] === this.roomsRange[1];
            this.lfgChannel = await bot.channels.fetch(settings.lfg) as TextChannel;

            this.roomSize = this.rawVoices
                .map(v => v.userLimit)
                .reduce((acc, val) => {
                    acc.has(val) ? acc.get(val).times++ : acc.set(val, { times: 1});
                    return acc;
                }, new Collection<number, { times: number }>())
                .sort((a, b) => a.times - b.times)
                .lastKey();

            await this.lfgChannel.messages.fetch({ limit: 100 });
            await this.lfgChannel.bulkDelete(this.lfgChannel.messages
                .filter(m =>
                    (m.createdTimestamp > (Date.now() - 13 * 24 * 60 * 60 * 1000))
                    && (m.author.bot || !m.member.hasPermission('MANAGE_ROLES')),
                ));

            const loadingMsg = await this.lfgChannel.send('Лобби загружаются, подождите минутку') as Message;
            const voices = this.rawVoices.sort((a, b) => b.members.size - a.members.size).array();
            const cond = (v, i, a) => i >= this.roomsRange[0] && !v.members.size && i !== a.length;
            const toDelete = voices.filter(cond);

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
            const generatedRooms = await Promise.all(this.rawVoices.map(vc => new LSRoom(vc, this).init()));
            lobbyStoresRooms = new Collection([ ...lobbyStoresRooms.values(), ...generatedRooms].map(l => [l.channel, l]));
            this.status = LSS.AVAILABLE;
            await loadingMsg.delete();
            await debug.warn(`${this.lfgChannel.guild.name} ${this.settings.type} VOICES ${this.rawVoices.size} LOBBIES ${this.rooms.size} ROOMS RANGE ${this.roomsRange} STATUS ${LSS[this.status]}`);

            // setInterval(this.watchActions, 500);
            // setInterval(this.purgeActions, 10000);
            setInterval(this.syncChannels, 5 * 60 * 1000);

            if (this.guild.fastLfg) {
                const fastLfg = await bot.channels.fetch(this.guild.fastLfg) as TextChannel;
                await fastLfg.messages.fetch();
                await fastLfg.bulkDelete(fastLfg.messages
                    .filter(m =>
                        (m.createdTimestamp > (Date.now() - 13 * 24 * 60 * 60 * 1000))
                        && (m && m.embeds && m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text === `ID - ${this.settings.type}`),
                    ));
                const msgOpts = await embeds.fastAppeal(this);
                this.fastAppealCache = JSON.stringify(msgOpts);
                this.fastAppeal = await fastLfg.send('', msgOpts) as Message;
            }

        })();
    }

    public syncChannels = () => Promise.all(this.rooms.map(l => l.dcChannel).filter(v => !v.deleted).sort((a, b) => a.position - b.position).map((v, i) => {
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
            const prevRoles = member.roles.clone();
            const newRoles = member.roles.filter(r => ![...Object.values(this.guild.platformRoles), ...Object.values(this.guild.rankRoles)].includes(r.id));
            await member.roles.set(newRoles);
            debug.log(`${member} исключен из \`${this.settings.type}\` на ${humanizeDuration(timeout, {conjunction: ' и ', language: 'ru', round: true})} по причине "${reason}". ${lobbyId ? `ID пати ${lobbyId}` : ''}`);
            setTimeout(() => member.roles.set(prevRoles), timeout);
        }
    }

    // @Ratelimiter
    @WaitLoaded
    // @Atomic
    public async join(member: GuildMember, to: LSRoom) {
        // console.log('JOIN');
        const lobby = this.rooms.get(to.id);
        if (!lobby) {return; }
        if (to.dcMembers.size === 1 && this.rooms.size <= this.roomsRange[1]) {
            lobby.dcLeader = member;
            if (!this.staticRooms || this.voices.size < this.roomsRange[0]) {
                await this.openLobby(lobby);
            }
        }
        // await this.atomicJoin(member, lobby);
        // await this.checkLobbyHealth(lobby);
    }

    // @Ratelimiter
    @WaitLoaded
    // @Atomic
    public async leave(from: LSRoom) {
        // console.log('LEAVE');
        const lobby = lobbyStoresRooms.get(from.id);
        if (!lobby) {return; }
        // await this.atomicLeave(member, lobby);
        if (from.dcMembers.size === 0) {
            if (this.staticRooms) {
                lobbyStoresRooms.delete(lobby.channel);
                lobbyStoresRooms.set(from.id, await new LSRoom(from.dcChannel, this).init());
                return;
            }
            if (this.rooms.size > this.roomsRange[0]) {
                return this.closeLobby(lobby);
            }
        } else {
            // return this.checkLobbyHealth(lobby);
        }
    }

    // private async checkLobbyHealth(lobby: Lobby) {
    //     try {
    //         if (!this.rawVoices.some((v: VoiceChannel) => v.members.size === 0) && !this.staticRooms) {
    //             console.log('adding new channel due error');
    //             this.openLobby(lobby);
    //         }
    //         await lobby.dcChannel.fetch();
    //         if (lobby.members.length !== lobby.dcMembers.size) {
    //             await lobby.$set('members', await User.findAll({ where: { id: lobby.dcMembers.map(m => m.id) } }));
    //             await lobby.reload({ include: [{all: true}] });
    //             if (lobby.members.length !== lobby.dcMembers.size) {
    //                 await Promise.all(lobby.dcMembers.filter(m => !Boolean(lobby.members.find(dbm => dbm.id === m.id))).map(m => this.kick(m, 10000, 'Требуется регистрация. Используйте `$rank ваш_Uplay` в канале для команд бота.')));
    //                 await this.checkLobbyHealth(lobby);
    //             }
    //         }
    //         if (lobby.dcLeader) {
    //             if (lobby.dcMembers.size === 0) {
    //                 lobby.dcLeader = null;
    //             } else if (!lobby.dcMembers.has(lobby.dcLeader.id)) {
    //                 lobby.dcLeader = lobby.dcMembers.random();
    //             }
    //         }
    //     } catch (err) {
    //         console.log('LOBBY CACHE MISS', err);
    //         await this.lobbies.delete(lobby.channel);
    //     }
    // }

    // public async updateAppealMsg(lobby: Lobby) {
    //     if (lobby.appealMessage) {
    //         if (lobby.dcInvite.expiresTimestamp < Date.now()) {
    //             try {
    //                 await lobby.appealMessage.delete();
    //             } catch (err) {
    //                 console.log('idgaf 1');
    //             }
    //             return lobby.appealMessage = null;
    //         }
    //         lobby.dcChannel = await lobby.dcChannel.fetch() as VoiceChannel;
    //         try {
    //             await lobby.appealMessage.edit('', await embeds.appealMsg(lobby));
    //             await this.updateFastAppeal();
    //         } catch (error) {
    //             console.log('pre idgaf 2');
    //             try {
    //                 await new Promise(res => setTimeout(res, 30 * 1000));
    //                 await this.lfgChannel.messages.fetch(lobby.appealMessage.id, false).then(msg => msg.delete());
    //             } catch (err) {
    //                 console.log('idgaf 2');
    //                 console.log(error, err);
    //             }
    //             lobby.appealMessage = null;
    //         // return lobby.appealMessage = await this.lfgChannel.send('', await embeds.appealMsg(lobby)) as Message;
    //         }
    //     }
    // }

    public async updateFastAppeal() {
        if (!(this.guild.fastLfg && this.fastAppeal)) { return; }
        const msgOpts = await embeds.fastAppeal(this);
        // console.log(this.fastAppealCache);
        // console.log(JSON.stringify(msgOpts));
        if (this.fastAppealCache !== JSON.stringify(msgOpts)) {
            this.fastAppealCache = JSON.stringify(msgOpts);
            await this.fastAppeal.edit('', msgOpts);
        }
    }

    private async openLobby(lobby: LSRoom) {
        const channelToClone = this.rawVoices.last();
        const clonedChannel = await channelToClone.clone({ name: channelToClone.name.replace(/#\d+/g, `#${this.rawVoices.size + 1}`), userLimit: this.roomSize }) as VoiceChannel;
        lobbyStoresRooms.set(clonedChannel.id, await new LSRoom(clonedChannel, this).init());
        this.updateFastAppeal();
    }

    private async closeLobby(lobby: LSRoom) {
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
        lobbyStoresRooms.delete(lobby.channel);
        this.updateFastAppeal();
        await this.category.fetch();
    }

    // private watchActions = () => {
    //     this.actionCounter.forEach(async (a, key, map) => {
    //         if (!a.kicked && a.times >= parseInt(ENV.KICK_LIMIT)) {
    //             a.kicked = true;
    //             return this.kick(a.member, 10000 * a.times, 'Вы временно отстранены от поиска за чрезмерную активность!');
    //         }
    //         if (!a.warned && a.times >= parseInt(ENV.KICK_LIMIT) * 0.75) {
    //             a.warned = true;
    //             try {
    //                 a.member.send('Вы совершаете слишком много действий! Умерьте пыл, или вы будете временно отстранены!');
    //             } catch (error) {
    //                 (await this.lfgChannel.send(`${a.member}, вы совершаете слишком много действий! Умерьте пыл, или вы будете временно отстранены!`) as Message).delete({ timeout: 30000 });
    //             }
    //         }
    //     });
    // }

    // private async atomicLeave(member: GuildMember, lobby: Lobby) {
    //     const dbUser = await User.findByPk(member.id);
    //     await lobby.$remove('members', dbUser);

    //     await lobby.reload({include: [{all: true}]});
    //     if (!lobby.open) {
    //         lobby.open = true;
    //         await lobby.dcChannel.setUserLimit(this.roomSize);
    //     }
    //     if (!lobby.dcMembers.size) {
    //         lobby.dcLeader = null;
    //     }
    //     if (lobby.dcMembers.size !== 0 && member.id === lobby.dcLeader.id) {
    //         const newLeader = lobby.dcMembers.random();
    //         // debug.log(`Лидер ${lobby.dcLeader} покинул комнату. Новый лидер - ${newLeader}. Через комнату прошли <@${lobby.log.join('>, <@')}>. ID пати \`${lobby.id}\``);
    //         // lobby.log = [];
    //         lobby.open = true;
    //         lobby.hardplay = false;
    //         this.handleHardplay(lobby);
    //         try {
    //             newLeader.send('Теперь Вы - лидер лобби');
    //         } catch (error) {
    //             (await this.lfgChannel.send(`${newLeader}, теперь Вы - лидер лобби`) as Message).delete({ timeout: 30000 });
    //         }
    //         lobby.dcLeader = newLeader;
    //     }
    //     await lobby.save();
    //     if (lobby.dcMembers.size) {
    //         await this.refreshIngameStatus(lobby);
    //         return this.updateAppealMsg(lobby);
    //     } else {
    //         if (lobby.appealMessage) {
    //             try {
    //                 await (await this.lfgChannel.messages.fetch(lobby.appealMessage.id)).delete();
    //             } catch (error) {
    //                 console.log('idgaf');
    //             }
    //             lobby.appealMessage = null;
    //             this.updateFastAppeal();
    //         }
    //         return;
    //     }
    // }

    // private async atomicJoin(member: GuildMember, lobby: Lobby) {
    //     const dbUser = await User.findByPk(member.id);
    //     // if (lobby.hardplay && dbUser.rank < lobby.limitRank) {
    //     //     return this.kick(member, 0, `Это лобби доступно только для \`${RANKS[lobby.limitRank]}\` и выше!`, lobby.id);
    //     // }
    //     this.uniqueUsers.add(dbUser.id);
    //     await lobby.$add('members', dbUser);
    //     await lobby.reload({include: [{all: true}]});
    //     if (!lobby.dcLeader) {
    //         lobby.dcLeader = member;
    //     }
    //     if (lobby.dcMembers.size >= this.roomSize && !lobby.appealMessage) {
    //         const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE) });
    //         lobby.invite = inv.url;
    //         await lobby.save();
    //         lobby.dcInvite = inv;
    //         lobby.appealMessage = await this.lfgChannel.send('', await embeds.appealMsg(lobby)) as Message;
    //         this.updateFastAppeal();
    //     } else {
    //         await this.updateAppealMsg(lobby);
    //     }
    //     await this.refreshIngameStatus(lobby);
    // }

}

export const lobbyStores: Collection<Snowflake/*LFG ID*/, LobbyStore> = new Collection();
export let lobbyStoresRooms: Collection<Snowflake/*VOICE ID*/, LSRoom> = new Collection();

export async function initLobbyStores() {
    const dbGuilds = await Guild.findAll({ where: { premium: true } });
    dbGuilds.map(g => {
        Object.entries(g.lobbySettings).map(ent => lobbyStores.set(ent[1].lfg, new LobbyStore(ent[1], g)));
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
