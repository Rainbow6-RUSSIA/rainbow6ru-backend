import { Guild, Lobby } from '@r6ru/db';
import { ILobbySettings, LobbyStoreStatus as LSS} from '@r6ru/types';
import { CategoryChannel, Collection, GuildMember, Message, MessageOptions, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '../..';
import bot from '../../bot';
// import Ratelimiter from '../utils/decorators/ratelimiter';
import WaitLoaded from '../decorators/wait_loaded';
import embeds from '../embeds';
import ENV from '../env';
import { LSRoom } from './room';
import { LSBase } from './utils';

const { Op } = Sequelize;
const initiatedAt = new Date();

export class LobbyStore extends LSBase {

    public constructor(settings: ILobbySettings, dbGuild: Guild) {
        super();
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
            this.category = await this.category.fetch() as CategoryChannel;
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
                msgOpts.embed.timestamp = new Date();
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

    public async reportJoin(room: LSRoom) {
        if (!this.staticRooms && room.dcMembers.size === 1 && this.rooms.size <= this.roomsRange[1]) {
            const channelToClone = this.rawVoices.last();
            const clonedChannel = await channelToClone.clone({ name: channelToClone.name.replace(/#\d+/g, `#${this.rawVoices.size + 1}`), userLimit: this.roomSize }) as VoiceChannel;
            lobbyStoresRooms.set(clonedChannel.id, await new LSRoom(clonedChannel, this).init());
        }
    }

    public async reportLeave(room: LSRoom) {
        if (room.dcMembers.size === 0) {
            if (this.staticRooms) {
                await room.deactivate();
                lobbyStoresRooms.set(room.channel, await new LSRoom(room.dcChannel, this).init());
                return;
            }
            if (this.rooms.size > this.roomsRange[0]) {
                const toDelete = room.dcChannel;
                await toDelete.delete();

                const toMove = this.voices.sort((a, b) => a.position - b.position).last();
                const pos = toDelete.position;
                await toMove.edit({
                    name: toDelete.name.replace('HardPlay ', '').replace(/#\d+/g, `#${pos + 1}`),
                    position: pos,
                }, 'подмена закрытого канала');
        // // await this.syncChannels();
                await this.category.fetch();
            }
        }
    }

    public async updateFastAppeal(appeal?: MessageOptions) {
        if (!(this.guild.fastLfg && this.fastAppeal)) { return; }
        // if (this.fastAppealTimeout || (this.fastAppeal.editedTimestamp || this.fastAppeal.createdTimestamp) > (Date.now() - parseInt(ENV.MESSAGE_COOLDOWN))) {
        //     this.fastAppealTimeoutMsg = await embeds.fastAppeal(this);
        //     if (!this.fastAppealTimeout) {
        //         clearTimeout(this.fastAppealTimeout);
        //         this.fastAppealTimeout = setTimeout(() => (this.fastAppealTimeout = null) || this.updateFastAppeal(this.fastAppealTimeoutMsg), Date.now() - (this.fastAppeal.editedTimestamp || this.fastAppeal.createdTimestamp) + 1);
        //     }
        // } else {
        const msgOpts = await embeds.fastAppeal(this);
        if (this.fastAppealCache !== JSON.stringify(msgOpts)) {
            this.fastAppealCache = JSON.stringify(msgOpts);
            msgOpts.embed.timestamp = new Date();
            this.fastAppeal = await this.fastAppeal.edit('', msgOpts);
            console.log('FAST APPEAL UPDATED');
        }
        // }
    }

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

//    {
//       "ranked": {
//         "lfg": "505831870735319055",
//         "voiceCategory": "505831824765747230",
//         "externalRooms": [],
//         "roomsRange": [5, 10],
//         "type": "ranked"}
//    }

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
