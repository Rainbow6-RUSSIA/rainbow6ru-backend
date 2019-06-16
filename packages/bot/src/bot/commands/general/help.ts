// import { TryCatch } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../../..';

export default class Help extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', '', 'H'],
            cooldown: 5000,
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message) => {
        return message.reply('some help');
    }
}
