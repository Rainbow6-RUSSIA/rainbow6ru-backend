import * as dotenv from 'dotenv';
dotenv.config();

import db from '@r6ru/db';
import { Log } from '@r6ru/utils';
import { WebhookClient } from 'discord.js';
import ENV from './utils/env';

export let debug: Log = null;

(async () => {
    await db(ENV.DB);
    const url = ENV.LOGGING_WEBHOOK.split('/');
    debug = new Log(await (await import('./bot')).user(), new WebhookClient(url[5], url[6]), 'BOT');
    debug.log('Started');
    await import('./r6api');
    await import('./server');
})();

if (process.env.MIGRATE === 'true') {
    import('./utils/migration');
}
