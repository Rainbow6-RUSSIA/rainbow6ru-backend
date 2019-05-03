import { TryCatch } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../..';

export default class Votekick extends Command {
    public constructor() {
        super('votekick', {
            aliases: ['votekick', 'VK'],
        });
    }

    @TryCatch(debug)
    public exec = async (message: Message) => {
        return message.reply('команда скоро™ будет доступна');
    }
}
