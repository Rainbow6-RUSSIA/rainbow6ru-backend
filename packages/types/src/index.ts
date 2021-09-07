import { GuildMember, Snowflake } from 'discord.js';

export const RankResolvable = [
    'Unranked',
    'Copper V', 'Copper IV', 'Copper III', 'Copper II', 'Copper I',
    'Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold III', 'Gold II', 'Gold I',
    'Platinum III', 'Platinum II', 'Platinum I',
    'Diamond III', 'Diamond II', 'Diamond I',
    'Champion',
];

export const RankGaps = [
    2500,
    1100, 1200, 1300, 1400, 1500,
    1600, 1700, 1800, 1900, 2000,
    2100, 2200, 2300, 2400, 2500,
    2600, 2800, 3000,
    3200, 3600, 4000,
    4100, 4400, 4700,
    5000
]

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

export enum VERIFICATION_LEVEL {
    NONE,
    MATCHNICK,
    R6DB,
    QR,
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

export enum MATCH_TYPE {
    BO1 = 'bo1',
    BO2 = 'bo2',
    BO3 = 'bo3',
    BO5 = 'bo5',
    BO7 = 'bo7',
}

export enum RANKS {
    'Unranked',
    'Copper V', 'Copper IV', 'Copper III', 'Copper II', 'Copper I',
    'Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold III', 'Gold II', 'Gold I',
    'Platinum III', 'Platinum II', 'Platinum I',
    'Diamond III', 'Diamond II', 'Diamond I',
    'Champion',
}

export enum ACCESS {
    OWNER = 100,
    ABSOLUTE = 90,
    ADMIN = 80,
    MODERATOR = 70,
    CONTENTMANAGER = 60,
    ALLNEWS = 50,
    NEWS = 40,
    // ...
    NONE = 0,
}

export interface IJWT {
    sub: string;
    exp: number;
    acc: number;
}

export const ONLINE_TRACKER = process.env.ONLINE_TRACKER; //'https://r6stats.com/stats/';

export const DefaultSocial = {
    discord: [],
    steam: [],
    twitch: [],
    vk: [],
    youtube: [],
};

export enum LobbyStoreEventType {
    JOIN, LEAVE, MOVE, KICK,
}

export enum LobbyStoreStatus {
    LOADING, TRANSACTING, AVAILABLE,
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
    CASUAL, CASUAL_SEARCH, UNRANKED, UNRANKED_SEARCH, RANKED, RANKED_SEARCH, NEWCOMER, NEWCOMER_SEARCH, TERRORIST_HUNT, CUSTOM, CUSTOM_SEARCH, DISCOVERY, DISCOVERY_SEARCH,
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
    [/Учебный лагерь/, /TRAINING GROUNDS/],
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
    0xa67df8, 0xa67df8, 0xa67df8,
    0xff0784,
    0,
    0,
];

export const RANK_BADGES = [
    '598137242829062154',
    '884869719193161778', '884869732732395581', '884869746389045288', '884869759127126037', '884869772846698546',
    '884869786381738044', '884869820221378650', '884869831571173487', '884869843013230642', '884869857185775656',
    '884869870875996171', '884869884167720981', '884869896683532412', '884869910830907482', '884869927310336010',
    '884869952224497734', '884869965075849248', '884869980359884870',
    '884869999930515537', '884870016527368212', '884870030741876778',
    '884870051663085629', '884870068213776414', '884870083522986005',
    '884870136840990730',
    '691300697517588480',
    '691300697517588480',
];

export const VERIFIED_BADGE = '593877747391135843';
export const BAN_BADGE = '414787874668412928';
export const NITRO_BADGE = '708671862602858516';
export const DONATE_BADGE = '476880992913850398';
export const ADMIN_BADGE = '767457897730277396';

export const EMOJI_REGEXP = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;

export type DonateRecord = [Snowflake, number, string, Snowflake[]];
//                          roleId     price   name    allowedUsers

export interface ILobbySettings {
    lfg: Snowflake;
    voiceCategory: Snowflake;
    roomsRange: [number, number];
    externalRooms: Snowflake[];
    type: string;
    allowedModes: IngameStatus[];
    disallowedModes: IngameStatus[];
    roomSize: number;
    enabled: boolean;
    roomName: string;
}

export const currentlyPlaying = [IngameStatus.CASUAL, IngameStatus.RANKED, IngameStatus.CUSTOM, IngameStatus.NEWCOMER, IngameStatus.DISCOVERY];
export enum EmojiButtons {
    CLOSE = '🔐',
    HARDPLAY = '🏆',
}

export enum UpdateStatus {
    SUCCESS,
    VERIFICATION_SENT,
    DM_CLOSED,
    GUILD_LEFT,
    GUILD_UNAVAILABLE,
    GUILD_NONPREMIUM,
    INCORRECT_CALL,
    ALREADY_SENT,

}
