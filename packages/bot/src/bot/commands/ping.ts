import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Ping extends Command {
    public constructor() {
        super('ping', {
            aliases: ['ping', 'P'],
        });
    }
    public async exec(message: Message) {
        const sent = await message.channel.send('Пинг...') as any;
        sent.edit(`Понг! Задержка ${sent.createdTimestamp - message.createdTimestamp}мс`);
        console.log('rank used');
    }
}
