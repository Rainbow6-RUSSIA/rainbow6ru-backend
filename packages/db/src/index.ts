import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import Guild from './models/Guild';
import GuildBlacklist from './models/GuildBlacklist';
import Lobby from './models/Lobby';
import MapR6 from './models/MapR6';
import Match from './models/Match';
import Pool from './models/Pool';
import Team from './models/Team';
import TeamMatch from './models/TeamMatch';
import Tournament from './models/Tournament';
import TournamentMod from './models/TournamentMod';
import User from './models/User';
import Vote from './models/Vote';

export default async (url: string, logging = false) => {
    const DB = new Sequelize(url, { logging });
    await DB.authenticate();
    DB.addModels([Guild, GuildBlacklist, Lobby, MapR6, Match, Pool, Team, TeamMatch, Tournament, TournamentMod, User, Vote]);
    await DB.sync({ force: process.env.DROP_DB === 'true', alter: process.env.ALTER_DB === 'true' });
};

export { Guild, GuildBlacklist, Lobby, MapR6, Match, Pool, Team, TeamMatch, Tournament, TournamentMod, User, Vote, Op };
