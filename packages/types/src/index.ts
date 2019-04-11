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

