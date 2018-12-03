export enum VERIFICATION_LEVEL {
    NONE,
    MATCHNICK,
    R6DB,
    QR,
}

export enum PLATFORM {
    PC = 'PC',
    PS4 = 'PS4',
    XBOX = 'XBOX'
}

export enum RANKS {
    UNRANKED,
    COPPER4,
    COPPER3,
    COPPER2,
    COPPER1,
    BRONZE4,
    BRONZE3,
    BRONZE2,
    BRONZE1,
    SILVER4,
    SILVER3,
    SILVER2,
    SILVER1,
    GOLD4,
    GOLD3,
    GOLD2,
    GOLD1,
    PLATINUM3,
    PLATINUM2,
    PLATINUM1,
    DIAMOND
}

export enum ACCESS {
    NONE,
    // ...
    NEWS,
    ALLNEWS,
    CONTENTMANAGER,
    MODERATOR,
    ADMIN,
    ABSOLUTE,
    OWNER,
}

export const RankResolvable = [
    'Unranked',
    'Copper IV', 'Copper III', 'Copper II', 'Copper I',
    'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold IV', 'Gold III', 'Gold II', 'Gold I',
    'Platinum III', 'Platinum II', 'Platinum I', 'Diamond'
]