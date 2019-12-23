import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import fetch from 'node-fetch';

export default class Help extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', '', 'H'],
            cooldown: 5000,
        });
    }

    public exec = async (message: Message) => {
        const res = await fetch('https://raw.githubusercontent.com/Rainbow6-RUSSIA/rainbow6ru-backend/master/packages/bot/HELP.md');
        return message.reply(await res.text());
    }
}
