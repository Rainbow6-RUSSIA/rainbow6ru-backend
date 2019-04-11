import * as dotenv from 'dotenv';
dotenv.config();

import db from '@r6ru/db';
import ENV from './utils/env';

(async () => {
    await db(ENV.DB);
    await import('./bot');
    await import('./r6api');
    await import('./server');
})();

if (process.env.MIGRATE === 'true') {
    import('./utils/migration');
}
