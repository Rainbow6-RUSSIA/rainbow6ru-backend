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

export enum IngameStatus {
    MENU, CASUAL, CASUAL_SEARCH, RANKED, RANKED_SEARCH, TERRORIST_HUNT, CUSTOM, CUSTOM_SEARCH, OTHER
}

export const R6_PRESENCE_ID = '445956193924546560';
export const R6_PRESENCE_REGEXPS = [
    [/В\s+МЕНЮ/g,/in\s+MENU/g],
    [/ОБЫЧНАЯ\s+ИГРА\:\s+раунд/g,/CASUAL\s+match\s+\-\s+Round/g],
    [/Поиск\s+игры\:\s+ОБЫЧНАЯ\s+ИГРА/g,/Looking\s+for\s+CASUAL\s+match/g],
    [/Игра\s+РЕЙТ\.\s+ИГРА\s+\-\s+раунд/g,/RANKED\s+match\s+\-\s+Round/g],
    [/Поиск\s+игры\:\s+РЕЙТ\.\s+ИГРА/g,/Looking\s+for\s+RANKED\s+match/g],
    [/Завершение\s+операции\s+"Антитеррор"/g,/Completing\s+a\s+TERRORIST\s+HUNT\s+mission/g],
    [/Игра\s+ПОЛЬЗ\.\s+ИГРА\s+\-\s+раунд/g],
    [/Поиск\s+игры\:\s+ПОЛЬЗ\.\s+ИГРА/g]

]