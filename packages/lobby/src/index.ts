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
    await import('./server');
    console.log('[INFO][GENERIC] REST API started');
})();

if (process.env.MIGRATE === 'true') {
    console.log('migration removed');
    // import('./utils/migration');
}

const rebootTime = new Date();
rebootTime.setHours(parseInt(ENV.REBOOT_TIME.split('_')[0]), parseInt(ENV.REBOOT_TIME.split('_')[1]), 0, 0);
const diff = rebootTime.getTime() - new Date().getTime();

const time = diff > 0 ? diff : diff + 24 * 60 * 60 * 1000;
console.log(`[INFO][GENERIC] Reboot in ${time / 1000 / 60} min`);

setInterval(() => {
    console.log('reboot');
    process.exit(0);
}, time);
