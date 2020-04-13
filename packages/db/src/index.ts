import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import Guild from './models/Guild';
import GuildBlacklist from './models/GuildBlacklist';
import Lobby from './models/Lobby';
import User from './models/User';

export default async (url: string, logging = false) => {
    const DB = new Sequelize(url, { logging });
    await DB.authenticate();
    DB.addModels([Guild, GuildBlacklist, Lobby, User]);
    await DB.sync({ force: process.env.DROP_DB === 'true', alter: process.env.ALTER_DB === 'true' });
};

export { Guild, GuildBlacklist, Lobby, User, Op };

