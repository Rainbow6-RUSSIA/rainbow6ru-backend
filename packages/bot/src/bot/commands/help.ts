import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Help extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', '', 'H'],
            cooldown: 5000,
        });
    }
    public exec = async (message: Message) => {
        return message.reply('some help');
    }
}
