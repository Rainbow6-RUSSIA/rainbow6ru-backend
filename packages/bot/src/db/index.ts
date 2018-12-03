import {Sequelize} from 'sequelize-typescript';

// export const mainDB = new Sequelize(process.env.MAIN_DB);
export const DB = new Sequelize({
    url: process.env.DB,
    define: {
        schema: 'siegebot'
    }
})

import { Guild } from '../models/Guild';
import { User } from '../models/User';
import { GuildBlacklist } from '../models/GuildBlacklist';
// import {Queue} from '../models/Queue';
// import {User} from '../models/User';

DB.addModels([Guild, GuildBlacklist, User]);
DB.sync();
DB.authenticate();
