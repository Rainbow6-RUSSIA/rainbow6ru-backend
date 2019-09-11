import { GuildMember, Snowflake } from 'discord.js';

export const RankResolvable = [
    'Unranked',
    'Copper V', 'Copper IV', 'Copper III', 'Copper II', 'Copper I',
    'Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold III', 'Gold II', 'Gold I',
    'Platinum III', 'Platinum II', 'Platinum I',
    'Diamond',
    'Champion',
];

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

export enum REGIONS {
    A_EMEA = 'emea',
    B_APAC = 'apac',
    C_NCSA = 'ncsa',
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
    'Diamond',
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

export const ONLINE_TRACKER = 'https://r6tab.com/';

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
    [/МЕНЮ/g, /MENU/g],
    [/ОБЫЧНАЯ.+раунд/g, /CASUAL.+Round/g],
    [/Поиск.+ОБЫЧНАЯ/g, /Looking.+CASUAL/g],
    [/БЕЗРЕЙТ.+раунд/g, /UNRANKED.+Round/g],
    [/Поиск.+БЕЗРЕЙТ/g, /Looking.+UNRANKED/g],
    [/РЕЙТ.+раунд/g, /RANKED.+Round/g],
    [/Поиск.+РЕЙТ/g, /Looking.+RANKED/g],
    [/НОВИЧОК.+раунд/g, /NEWCOMER.+Round/g],
    [/Поиск.+НОВИЧОК/g, /Looking.+NEWCOMER/g],
    [/Антитеррор/g, /TERRORIST HUNT/g],
    [/Игра.+ПОЛЬЗ/g],
    [/Поиск.+ПОЛЬЗ/g],
    [/РАЗВЕДКА.+раунд/g, /DISCOVERY.+Round/g],
    [/Поиск.+РАЗВЕДКА/g, /Looking.+DISCOVERY/g],
];

export const RANK_COLORS = [
    0x231f20,
    0x7c2b00, 0x7c2b00, 0x7c2b00, 0x7c2b00,
    0xbc783c, 0xbc783c, 0xbc783c, 0xbc783c,
    0xa5a5a5, 0xa5a5a5, 0xa5a5a5, 0xa5a5a5,
    0xedaf35, 0xedaf35, 0xedaf35, 0xedaf35,
    0xb6ffff, 0xb6ffff, 0xb6ffff,
    0xc07bde,
];

export const RANK_BADGES = [
    '<:rank0:598137242829062154>',
    '<:rank1:598137242451443743>', '<:rank2:598137243260944394>', '<:rank3:598137243043102720>', '<:rank4:598137243001159680>',
    '<:rank5:598137242946371584>', '<:rank6:598137242955022347>', '<:rank7:598137244100067329>', '<:rank8:598137243001159681>',
    '<:rank9:598137243529641994>', '<:rank10:598137242996703235>', '<:rank11:598137242996703234>', '<:rank12:598137243193966592>',
    '<:rank13:598137243391229962>', '<:rank14:598137243206418432>', '<:rank15:598137243659665408>', '<:rank16:598137243349024768>',
    '<:rank17:598137243206418462>', '<:rank18:598137243013742593>', '<:rank19:598137243336704030>',
    '<:rank20:598137243277721629>',
];

export const EMOJI_REGEXP = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

export type DonateRecord = [Snowflake, number, string, Snowflake[]];
//                          roleId     price   name    allowedUsers
