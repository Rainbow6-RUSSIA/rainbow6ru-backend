import { Guild, Lobby } from '@r6ru/db';
import { ILobbySettings, LobbyStoreStatus as LSS} from '@r6ru/types';
import { CategoryChannel, Collection, GuildMember, Message, MessageOptions, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '../..';
import bot from '../../bot';
import Throttle from '../decorators/throttle';
import embeds from '../embeds';
import ENV from '../env';
import { LSRoom } from './room';

const { Op } = Sequelize;
const initiatedAt = new Date();

export class LobbyStore {

    public category: CategoryChannel;
    public lfgChannel: TextChannel;

    // public promiseQueue = [];
    public roomsRange: [number, number];
    public staticRooms: boolean;

    public fastAppeal: Message;
    public fastAppealCache: string;

    // public actionCounter: Collection<Snowflake, IActivityCounter> = new Collection();
    public loadedAt = new Date();
    public uniqueUsers = new Set<Snowflake>();
    public status: LSS = LSS.LOADING;

    public constructor(public settings: ILobbySettings, public guild: Guild, init?: boolean) {
        this.roomsRange = this.settings.roomsRange || [5, 10];
        this.staticRooms = this.roomsRange[0] === this.roomsRange[1];

        if (init) {
            this.init();
        }
    }

    public async init() {
        this.category = await bot.channels.fetch(this.settings.voiceCategory) as CategoryChannel;
        this.lfgChannel = await bot.channels.fetch(this.settings.lfg) as TextChannel;

        await this.lfgChannel.messages.fetch({ limit: 100 });
        await this.lfgChannel.bulkDelete(this.lfgChannel.messages
            .filter(m =>
                (m.createdTimestamp > (Date.now() - 13 * 24 * 60 * 60 * 1000))
                && (m.author.bot || !m.member.hasPermission('MANAGE_ROLES')),
            ));

        const loadingMsg = await this.lfgChannel.send('Лобби загружаются, подождите минутку') as Message;

        if (!this.staticRooms) {
            const voices = this.voices.sort((a, b) => b.members.size - a.members.size);
            const keys = voices.keyArray();

            await Promise.all(voices
                .filter((v, key, a) => !v.members.size
                    && (keys.indexOf(v.id) >= this.roomsRange[0])
                    && a.lastKey() !== v.id
                )
                .map(v => v.delete())
            );

            if (!voices.find(v => v.members.size === 0)) {
                const channelToClone = await this.voices.last();
                await channelToClone.clone({ name: channelToClone.name.replace(/#\d+/g, n => `${n + 1}`), userLimit: this.settings.roomSize });
            }

            this.category = await this.category.fetch() as CategoryChannel;
        }

        const generatedRooms = await Promise.all(this.voices.map(v => new LSRoom(v, this).init()));
        lobbyStoresRooms = new Collection([ ...lobbyStoresRooms.values(), ...generatedRooms].map(l => [l.channel, l]));

        this.status = LSS.AVAILABLE;

        try {
            await loadingMsg.delete();
        } catch (error) {/* */}

        await debug.warn(`${this.lfgChannel.guild.name} ${this.settings.type} VOICES ${this.voices.size} LOBBIES ${this.rooms.size} ROOMS RANGE ${this.roomsRange} STATUS ${LSS[this.status]}`);

            // setInterval(this.watchActions, 500);
            // setInterval(this.purgeActions, 10000);
        setInterval(this.syncChannels, 5 * 60 * 1000);

        await this.updateFastAppeal();

        return this;
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

    public async reportJoin(room: LSRoom, internal: boolean) { // вызывается при первом входе, нужно ли перестраивать список комнат?
        if (!internal && !this.staticRooms && this.rooms.size < this.roomsRange[1]) {
            const channelToClone = this.voices.last();
            await channelToClone.clone({ name: channelToClone.name.replace(/#\d+/g, n => `${n + 1}`), userLimit: this.settings.roomSize });
        }
    }

    public async reportLeave(room: LSRoom, internal: boolean) { // вызывается при выходе последнего, нужно ли перестраивать список комнат?
        // console.log('LEAVE REPORTED', this.rooms.size > this.roomsRange[0]);
        if (internal || this.rooms.size <= this.roomsRange[0] || this.staticRooms) {
            // await room.deactivate();
            lobbyStoresRooms.set(room.channel, await new LSRoom(room.dcChannel, this).init());
            return;
        }
        if (this.rooms.size > this.roomsRange[0]) {
            const toDelete = room.dcChannel;
            const pos = toDelete.position;
            await toDelete.delete();

            const toMove = this.voices.last();
            try {
                await toMove.edit({
                    name: toMove.name.replace(/#\d+/g, `#${pos + 1}`),
                    position: pos,
                }, 'подмена закрытого канала');
                console.log(`${this.settings.type} EXIT REPLACE ${this.voices.size}`);
                lobbyStoresRooms.get(toMove.id).updateAppeal();
            } catch (error) {
                console.log('FAIL ON REPLACE', error);
            }
    // // await this.syncChannels();
            await this.category.fetch();
        }
    }

    private async initFastAppeal() {
        if (!this.guild.fastLfg) { return false; }
        if (!this.fastAppeal) {
            const fastLfg = await bot.channels.fetch(this.guild.fastLfg) as TextChannel;
            const messages = await fastLfg.messages.fetch();
            await Promise.all(
                messages
                .filter(m => m
                    && m.embeds
                    && m.embeds[0]
                    && m.embeds[0].footer
                    && m.embeds[0].footer.text === `ID - ${this.settings.type}`
                )
                .map(m => m.delete())
            );
            const msgOpts = await embeds.fastAppeal(this);
            this.fastAppealCache = JSON.stringify(msgOpts);
            msgOpts.embed.timestamp = new Date();
            this.fastAppeal = await fastLfg.send('', msgOpts) as Message;
        }
        return true;
    }

    @Throttle(3000)
    public async updateFastAppeal() {
        if (await this.initFastAppeal()) {
            const msgOpts = await embeds.fastAppeal(this);
            if (this.fastAppealCache !== JSON.stringify(msgOpts)) {
                this.fastAppealCache = JSON.stringify(msgOpts);
                msgOpts.embed.timestamp = new Date();
                this.fastAppeal = await this.fastAppeal.edit('', msgOpts);
            }
        }
    }

    get rooms() {
        return lobbyStoresRooms.filter((r, id) => this.settings.externalRooms.includes(id) || this.category.children.has(id));
    }

    get voices() {
        return this.category.children.filter(ch => ch instanceof VoiceChannel && !ch.deleted).sort((a, b) => a.position - b.position) as Collection<string, VoiceChannel>;
    }

    get joinAllowedRooms() {
        return this.rooms.filter(l => l.joinAllowed).size;
    }

}

export const lobbyStores: Collection<Snowflake/*LFG ID*/, LobbyStore> = new Collection();
export let lobbyStoresRooms: Collection<Snowflake/*VOICE ID*/, LSRoom> = new Collection();

export async function initLobbyStores() {
    const dbGuilds = await Guild.findAll({ where: { premium: true } });
    dbGuilds.map(g => {
        Object.entries(g.lobbySettings).map(ent => lobbyStores.set(ent[1].lfg, new LobbyStore(ent[1], g, true)));
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
//         "type": "ranked"},
//       "casual": {
//         "lfg": "593497036868026368",
//         "voiceCategory": "629050460745105427",
//         "externalRooms": [],
//         "roomsRange": [5, 10],
//         "type": "casual"
//       }
//    }

// "casual": "580774727757594624",

// "casual": "580774892618645524",

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
