import * as dotenv from 'dotenv';
dotenv.config();

import db from '@r6ru/db';
import ENV from './utils/env';
db(ENV.DB);

import './server';

import './bot';
