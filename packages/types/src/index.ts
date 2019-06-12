import { GuildMember, Snowflake } from 'discord.js';

export const RankResolvable = [
    'Unranked',
    'Copper IV', 'Copper III', 'Copper II', 'Copper I',
    'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold IV', 'Gold III', 'Gold II', 'Gold I',
    'Platinum III', 'Platinum II', 'Platinum I', 'Diamond',
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
    'Copper IV', 'Copper III', 'Copper II', 'Copper I',
    'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold IV', 'Gold III', 'Gold II', 'Gold I',
    'Platinum III', 'Platinum II', 'Platinum I', 'Diamond',
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
    JOIN, LEAVE, MOVE, KICK
}

export enum LobbyStoreStatus {
    LOADING, TRANSACTING, AVAILABLE
}

export type ILobbyStoreEventType = 'join' | 'leave' | 'move' | 'report';

export interface IActivityCounter {
    member: GuildMember;
    times: number;
    warned: boolean;
    kicked: boolean;
}

export enum IngameStatus {
    OTHER = -1,
    MENU = 0,
    CASUAL, CASUAL_SEARCH, RANKED, RANKED_SEARCH, TERRORIST_HUNT, CUSTOM, CUSTOM_SEARCH, DISCOVERY, DISCOVERY_SEARCH
}

export const R6_PRESENCE_ID = '445956193924546560';

export const R6_PRESENCE_REGEXPS = [
    [/МЕНЮ/g, /MENU/g],
    [/ОБЫЧНАЯ.+раунд/g, /CASUAL.+Round/g],
    [/Поиск.+ОБЫЧНАЯ/g, /Looking.+CASUAL/g],
    [/РЕЙТ.+раунд/g, /RANKED.+Round/g],
    [/Поиск.+РЕЙТ/g, /Looking.+RANKED/g],
    [/Антитеррор/g, /TERRORIST HUNT/g],
    [/Игра.+ПОЛЬЗ/g],
    [/Поиск.+ПОЛЬЗ/g],
    [/РАЗВЕДКА.+раунд/g,/DISCOVERY.+Round/g],
    [/Поиск.+РАЗВЕДКА/g, /Looking.+DISCOVERY/g]
];

export const RANK_COLORS = [
    0x231f20,
    0x7c2b00,0x7c2b00,0x7c2b00,0x7c2b00,
    0xbc783c,0xbc783c,0xbc783c,0xbc783c,
    0xa5a5a5,0xa5a5a5,0xa5a5a5,0xa5a5a5,
    0xedaf35,0xedaf35,0xedaf35,0xedaf35,
    0xb6ffff,0xb6ffff,0xb6ffff,
    0xc07bde
];

export type DonateRecord = [Snowflake, number, string, Snowflake[]]
//                          roleId     price   name    allowedUsers