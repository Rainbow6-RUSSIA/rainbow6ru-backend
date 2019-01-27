import { Sequelize } from 'sequelize-typescript';

import G from './models/Guild';
import GB from './models/GuildBlacklist';
import L from './models/Lobby';
import M from './models/Map';
import MM from './models/Match';
import T from './models/Team';
import TM from './models/TeamMatch';
import U from './models/User';
import V from './models/Vote';

export default (url: string) => {
    const DB = new Sequelize({ url });
    DB.addModels([G, GB, L, M, MM, T, TM, U, V]);
    DB.sync({ force: process.env.DROP_DB === 'true' });
    DB.authenticate();
};

// tslint:disable:max-classes-per-file
export class Guild extends G {}
export class GuildBlacklist extends GB {}
export class Lobby extends L {}
export class Map extends M {}
export class Match extends MM {}
export class Team extends T {}
export class TeamMatch extends TM {}
export class User extends U {}
export class Vote extends V {}
