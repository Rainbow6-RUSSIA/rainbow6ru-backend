import { Sequelize } from 'sequelize-typescript';

import Guild from './models/Guild';
import GuildBlacklist from './models/GuildBlacklist';
import Lobby from './models/Lobby';
import MapR6 from './models/MapR6';
import Match from './models/Match';
import Pool from './models/Pool';
import Team from './models/Team';
import TeamMatch from './models/TeamMatch';
import User from './models/User';
import Vote from './models/Vote';

export default (url: string, logging = false) => {
    const DB = new Sequelize({ url, logging});
    DB.addModels([Guild, GuildBlacklist, Lobby, MapR6, Match, Pool, Team, TeamMatch, User, Vote]);
    DB.sync({ force: process.env.DROP_DB === 'true' });
    DB.authenticate();
};

export {
    Guild, GuildBlacklist, Lobby, MapR6, Match, Pool, Team, TeamMatch, User, Vote,
};
