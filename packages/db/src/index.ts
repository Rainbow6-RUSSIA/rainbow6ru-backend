import { Sequelize } from 'sequelize-typescript';

import G from './models/Guild';
import GB from './models/GuildBlacklist';
import L from './models/Lobby';
import M from './models/Match';
import T from './models/Team';
import U from './models/User';
import V from './models/Vote';

export default (url) => {
    const DB = new Sequelize({ url });
    DB.addModels([G, GB, L, M, T, U, V]);
    DB.sync({ force: process.env.DROP_DB === 'true' });
    DB.authenticate();
};

export const Guild = G;
export const GuildBlacklist = GB;
export const Lobby = L;
export const Match = M;
export const Team = T;
export const User = U;
export const Vote = V;
