import {Sequelize} from 'sequelize-typescript';

export const mainDB = new Sequelize(process.env.MAIN_DB);

import {Guild} from '../models/Guild';
// import {Queue} from '../models/Queue';
// import {User} from '../models/User';

mainDB.addModels([Guild]);
mainDB.sync();
mainDB.authenticate();
