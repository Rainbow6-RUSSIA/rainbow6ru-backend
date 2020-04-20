import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import Account from './models/Account';
import Guild from './models/Guild';
import Lobby from './models/Lobby';
import User from './models/User';
import UserAccount from './models/UserAccount';

export default async (url: string, logging = false) => {
    const DB = new Sequelize(url, { logging });
    await DB.authenticate();
    DB.addModels([Account, Guild, Lobby, User, UserAccount]);
    await DB.sync({ force: process.env.DROP_DB === 'true', alter: process.env.ALTER_DB === 'true' });
};

export { Account, Guild, Lobby, User, UserAccount, Op, Sequelize };

