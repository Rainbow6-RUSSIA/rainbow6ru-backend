import { AkairoClient } from 'discord-akairo';

export const bot = new AkairoClient({
    ownerID: process.env.OWNERS.split(','),
    prefix: process.env.PREFIX,
    commandDirectory: './src/bot/commands/',
    inhibitorDirectory: './src/bot/inhibitors/',
    listenerDirectory: './src/bot/listeners/',
}, {});

bot.login(process.env.DISCORD_TOKEN).then(() => console.log('Bot started!'));
