import { TryCatch } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../..';

export default class Ping extends Command {
    public constructor() {
        super('ping', {
            aliases: ['ping', 'P'],
        });
    }

    @TryCatch(debug)
    public exec = async (message: Message) => {
        const sent = await message.channel.send('Пинг...') as any;
        return sent.edit(`Понг! Задержка ${sent.createdTimestamp - message.createdTimestamp}мс`);
    }
}
