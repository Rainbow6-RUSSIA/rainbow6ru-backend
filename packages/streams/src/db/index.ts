import { Sequelize } from 'sequelize-typescript';
import { Match } from '../models/Match';
import { Vote } from '../models/Vote';
import { ENV } from '../utils/types';

export const DB = new Sequelize({
    url: ENV.DB,
    define: {
        schema: 'streambot',
    },
});

DB.addModels([Match, Vote]);
DB.sync({ force: ENV.DANGER_DROP_BEFORE_START === 'true' });
DB.authenticate();
