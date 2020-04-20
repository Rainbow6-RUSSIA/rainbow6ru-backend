import { GuildMember, Snowflake } from 'discord.js';

export type UUID = string;

export interface IHistoryRecord {
    record: string;
    timestamp: number;
}

export interface IUbiBound {
    nickname?: string;
    genome?: string;
    err?: Error;
    platform?: PLATFORM;
}

export enum PLATFORM {
    PC = 'PC',
    PS4 = 'PS4',
    XBOX = 'XBOX',
}

export enum HF_PLATFORM {
    PC = 'PC',
    PS4 = 'PSN',
    XBOX = 'Xbox LIVE',
}

export enum REGIONS {
    A_EMEA = 'emea',
    B_APAC = 'apac',
    C_NCSA = 'ncsa',
}

export enum HF_REGIONS {
    emea = 'Europe (emea)',
    apac = 'Asia (apac)',
    ncsa = 'North America (ncsa)',
}

export enum RANKS {
    'Unranked',
    'Copper V',
    'Copper IV',
    'Copper III',
    'Copper II',
    'Copper I',
    'Bronze V',
    'Bronze IV',
    'Bronze III',
    'Bronze II',
    'Bronze I',
    'Silver V',
    'Silver IV',
    'Silver III',
    'Silver II',
    'Silver I',
    'Gold III',
    'Gold II',
    'Gold I',
    'Platinum III',
    'Platinum II',
    'Platinum I',
    'Diamond',
    'Champion',
}

export enum USER_FLAGS {
    NONE,
    ADMIN = 1 << 1,
    STAFF = 1 << 2,
    AGE18 = 1 << 3,
    NITRO_BOOST = 1 << 4,
    DONATE = 1 << 5,
    TOXIC = 1 << 6
    // ABSOLUTE = 90,
    // ADMIN = 80,
    // MODERATOR = 70,
    // CONTENTMANAGER = 60,
    // ALLNEWS = 50,
    // NEWS = 40,
    // ...
}

export interface IJWT {
    sub: string;
    exp: number;
    acc: number;
}

export const ONLINE_TRACKER = (id: string) => `http://r6stats.com/stats/${id}`;

export enum LobbyStoreEventType {
    JOIN,
    LEAVE,
    MOVE,
    KICK,
}

export enum LobbyStoreStatus {
    LOADING,
    TRANSACTING,
    AVAILABLE,
}

export type ILobbyStoreEventType = 'join' | 'leave' | 'move' | 'report';

export interface IActivityCounter {
    member: GuildMember;
    times: number;
    warned: boolean;
    kicked: boolean;
}

export enum IngameStatus {
    LOADING = -2,
    OTHER = -1,
    MENU = 0,
    CASUAL,
    CASUAL_SEARCH,
    UNRANKED,
    UNRANKED_SEARCH,
    RANKED,
    RANKED_SEARCH,
    NEWCOMER,
    NEWCOMER_SEARCH,
    TERRORIST_HUNT,
    CUSTOM,
    CUSTOM_SEARCH,
    DISCOVERY,
    DISCOVERY_SEARCH,
}

export const R6_PRESENCE_ID = '445956193924546560';

export const R6_PRESENCE_REGEXPS = [
    [/МЕНЮ/, /MENU/],
    [/БЫСТРАЯ.+раунд/, /QUICK.+Round/],
    [/Поиск.+БЫСТРАЯ/, /Looking.+QUICK/],
    [/БЕЗРЕЙТ.+раунд/, /UNRANKED.+Round/],
    [/Поиск.+БЕЗРЕЙТ/, /Looking.+UNRANKED/],
    [/РЕЙТ.+раунд/, /RANKED.+Round/],
    [/Поиск.+РЕЙТ/, /Looking.+RANKED/],
    [/НОВИЧОК.+раунд/, /NEWCOMER.+Round/],
    [/Поиск.+НОВИЧОК/, /Looking.+NEWCOMER/],
    [/Антитеррор/, /TERRORIST HUNT/],
    [/Игра.+ПОЛЬЗ/, /CUSTOM.+Round/],
    [/Поиск.+ПОЛЬЗ/, /Looking.+CUSTOM/],
    [/РАЗВЕДКА.+раунд/, /DISCOVERY.+Round/],
    [/Поиск.+РАЗВЕДКА/, /Looking.+DISCOVERY/],
];

export const RANK_COLORS = [
    0x1f191a,
    0x902700, 0x902700, 0x902700, 0x902700, 0x902700,
    0xd17935, 0xd17935, 0xd17935, 0xd17935, 0xd17935,
    0xa7a7a7, 0xa7a7a7, 0xa7a7a7, 0xa7a7a7, 0xa7a7a7,
    0xffb120, 0xffb120, 0xffb120,
    0x00cdc1, 0x00cdc1, 0x00cdc1,
    0xa67df8,
    0xff0784,
];

export const RANK_BADGES = [
    '598137242829062154',
    '622165779328270367', '598137242451443743', '598137243260944394', '598137243043102720', '598137243001159680',
    '622165779843907584', '598137242946371584', '598137242955022347', '598137244100067329', '598137243001159681',
    '622165779990839318', '598137243529641994', '598137242996703235', '598137242996703234', '598137243193966592',
    '598137243206418432', '598137243659665408', '598137243349024768',
    '598137243206418462', '598137243013742593', '598137243336704030',
    '598137243277721629',
    '622159827681935371',
];

export const VERIFIED_BADGE = '593877747391135843';
export const BAN_BADGE = '593877747189940234';

export const EMOJI_REGEXP = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;

export type DonateRecord = [Snowflake, number, string, Snowflake[]];
//                          roleId     price   name    allowedUsers

export enum LOBBY_FLAGS {
    NONE,
    CLOSE = 1 << 1,
    HARDPLAY = 1 << 2,
    DERANK = 1 << 3,
    AGE18 = 1 << 4

}

export enum EmojiButtons {
    CLOSE = '🔐',
    HARDPLAY = '🏆',
    DERANK = '📉',
    AGE18 = '🔞',
}

export interface ILobbySettings {
    lfg: Snowflake;
    voiceCategory: Snowflake;
    rooms: [LobbyType, [number, number]][];
    roomSize: number;
    enabled: boolean;
}

export enum LobbyType {
    /**
     * Показывает всех юзеров без привязки к БД (для всех игр)
     */
    'DEFAULT',
    'RANKED',
    'CASUAL',
    'UNRANKED',
    /**
     * Комната для ДВ и Америки
     */
    'REGION',
    /**
     * Показывает стату с консолей
     */
    'CONSOLE',
    /**
     * Кастом на 5 мест (показывать стату в кастоме, которой нет)
     */
    'CUSTOM',
    /**
     * Общий кастом на 12 мест
     */
    'CUSTOM_GENERAL',
    /**
     * Показывать стату в ТХ
     */
    'TERRORIST_HUNT',
    /**
     * Показывает всех юзеров, выделяя тех, кто в БД (для игр Юбисофт)
     */
    'SIMPLE',
}

export const currentlyPlaying = [
    IngameStatus.CASUAL,
    IngameStatus.RANKED,
    IngameStatus.CUSTOM,
    IngameStatus.NEWCOMER,
    IngameStatus.DISCOVERY,
];

export enum UpdateStatus {
    SUCCESS,
    VERIFICATION_SENT,
    DM_CLOSED,
    GUILD_LEFT,
    GUILD_UNAVAILABLE,
    GUILD_NONPREMIUM,
    INCORRECT_CALL,
}
