import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Account extends Command {
    public constructor() {
        super('account', {
            aliases: ['acc', 'account'],
        });
    }

    public async exec(message: Message) {
        const sent = await message.channel.send('Пинг...') as any;
        return sent.edit(`Понг! Задержка ${sent.createdTimestamp - message.createdTimestamp}мс`);
    }
}
