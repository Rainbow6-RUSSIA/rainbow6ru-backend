import {Sequelize} from 'sequelize-typescript';

import { Guild } from '../models/Guild';
import { GuildBlacklist } from '../models/GuildBlacklist';
import { User } from '../models/User';
import { ENV } from '../utils/types';

export const DB = new Sequelize({
    url: process.env.DB,
    define: {
        schema: 'siegebot',
    },
});

DB.addModels([Guild, GuildBlacklist, User]);
DB.sync({ force: ENV.DANGER_DROP_BEFORE_START === 'true' });
DB.authenticate();
