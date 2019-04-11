import * as dotenv from 'dotenv';
dotenv.config();

import db from '@r6ru/db';
import ENV from './utils/env';

(async () => {
    await db(ENV.DB);
    await import('./server');
    await import('./bot');
})();
