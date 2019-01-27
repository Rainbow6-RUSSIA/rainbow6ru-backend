import * as dotenv from 'dotenv';
dotenv.config();

import './bot';
import db from '@r6ru/db';
import './server';

import ENV from './utils/env';

db(ENV.DB);
