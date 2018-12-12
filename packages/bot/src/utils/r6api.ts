import { UUID } from "./types";

// interface IConfig{
//     email: string,
//     password: string,
// }

export interface IIdentification {
    id: UUID,
    name: string,
    userId: UUID,
}

export interface IPlaytime {
    id: UUID,
    casual: number,
    ranked: number,
}

export interface IStats {
    id: UUID,
    general: {
        lost: number,
        won: number,
        kills: number,
        deaths: number,
    }
}

export interface ILevels {
    id: UUID,
    level: number
}

export interface IRanks {
    id: UUID,
    season: number,
    ncsa: IRegionRank,
    emea: IRegionRank,
    apac: IRegionRank,
}

export interface IRegionRank {
    max_mmr: number,
    skill_mean: number,
    abadons: number,
    rank: number,
    mmr: number,
    wins: number,
    skill_stdev: number,
    losses: number,
    max_rank: number,
}

export interface IR6API{
    findByName: (name: string) => Promise<IIdentification[]>,
    getCurrentName: (...ids: UUID[]) => Promise<IIdentification[]>
    getLevels: (...ids: UUID[]) => Promise<ILevels[]>
    getPlayTime: (...ids: UUID[]) => Promise<IPlaytime[]>
    getRanks: (...ids: UUID[]) => Promise<IRanks[]>
    getStats: (...ids: UUID[]) => Promise<IStats[]>
    getAuthToken: () => Promise<String>
}