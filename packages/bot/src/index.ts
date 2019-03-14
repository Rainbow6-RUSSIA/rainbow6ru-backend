import * as dotenv from 'dotenv';
dotenv.config();

import db from '@r6ru/db';
import './bot';
import './r6api';
import './server';

import ENV from './utils/env';
db(ENV.DB);
