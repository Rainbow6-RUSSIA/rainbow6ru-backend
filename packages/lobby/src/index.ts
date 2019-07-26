import * as dotenv from 'dotenv';
dotenv.config();

import db from '@r6ru/db';
import { Log } from '@r6ru/utils';
import { WebhookClient } from 'discord.js';
import ENV from './utils/env';

export let debug: Log = null;

(async () => {
    await db(ENV.DB);
    console.log('[INFO][GENERIC] Connected to DB');
    const bot = await import('./bot');
    console.log('[INFO][BOT] Bot initialized');
    const url = ENV.LOGGING_WEBHOOK.split('/');
    debug = new Log(await bot.user(), new WebhookClient(url[5], url[6]), 'BOT');
    debug.log('Starting');
    console.log('[INFO][BOT] Webhook logging initialized');
    await import('./r6api');
    console.log('[INFO][BOT] Connected to Ubi servers');
    await import('./server');
    console.log('[INFO][GENERIC] REST API started');
})();

if (process.env.MIGRATE === 'true') {
    console.log('migration removed');
    // import('./utils/migration');
}

setInterval(() => {
    console.log('reboot');
    process.exit(0);
}, parseInt(ENV.REBOOT_TIME) || 24 * 60 * 60 * 1000);
