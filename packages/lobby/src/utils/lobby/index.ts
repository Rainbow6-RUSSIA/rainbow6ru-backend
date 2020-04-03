import { Guild, Lobby, Op, User } from '@r6ru/db';
import { ILobbySettings, LobbyStoreStatus as LSS} from '@r6ru/types';
import { RankedRoom, Room, CasualRoom, UntrackedRoom } from './rooms';
import { CategoryChannel, Collection, GuildMember, Message, MessageOptions, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import { UnrankedRoom } from './rooms/unranked';

const initiatedAt = new Date();

export class LobbyContainer<LT extends Room> {
    constructor(public settings: ILobbySettings, public guild: Guild, public ContaineredLobby: LT) {}
}

export const lobbyStores: Collection<Snowflake/*LFG ID*/, LobbyContainer<Room>> = new Collection();
export let lobbyStoresRooms: Collection<Snowflake/*VOICE ID*/, Room> = new Collection();

// export async function initLobbyStores() {
//     const dbGuilds = await Guild.findAll({ where: { premium: true } });
//     dbGuilds.map(g => {
//         Object.entries(g.lobbySettings).map(ent => ent[1].enabled && lobbyStores.set(ent[1].lfg, new LobbyContainer(ent[1], g, )));
//     });
//     const lobbies = await Lobby.findAll({
//         where: {
//             [Op.and]: [
//                 {initiatedAt: {[Op.lt]: initiatedAt}},
//                 {active: true},
//             ],
//         },
//     });
//     await Promise.all(lobbies.map(l => {
//         l.active = false;
//         return l.save();
//     }));
// }

function lobbySelector(type: LobbyType) {
    switch (type) {
        case LobbyType.RANKED: return RankedRoom;
        case LobbyType.CASUAL: return CasualRoom;
        case LobbyType.UNRANKED: return UnrankedRoom;

        case LobbyType.DEFAULT:
        default: return UntrackedRoom;
    }
}

export enum LobbyType {
    'DEFAULT', // показывает всех юзеров без привязки к БД (для всех игр)
    'RANKED',
    'CASUAL',
    'UNRANKED',
    'REGION', // комната для ДВ и Америки
    'CONSOLE', // показывать стату с консолей
    'CUSTOM', // кастом на 5 мест (показывать стату в кастоме)
    'CUSTOM_GENERAL', // общий кастом на 12 мест
    'TERRORIST_HUNT', // показывать стату в ТХ
    'SIMPLE', // показывает всех юзеров, выделяя тех, кто в БД (для игр Юбисофт)
}

// возможность запланировать игру в малопопулярных лобби
// канал удаляется через 15 минут
// логгирование в гугл таблицы