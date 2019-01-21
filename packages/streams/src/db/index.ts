import { Sequelize } from 'sequelize-typescript';
import { User } from '../../rainbow6ru-bot/src/models/User';
import { Match } from '../models/Match';
import { Team } from '../models/Team';
import { Vote } from '../models/Vote';
import { ENV } from '../utils/types';

export const DB = new Sequelize({
    url: ENV.DB,
    define: {
        schema: 'streambot',
    },
});

DB.addModels([Match, Vote, Team, User]);
DB.sync({ force: ENV.DANGER_DROP_BEFORE_START === 'true' });
DB.authenticate();
