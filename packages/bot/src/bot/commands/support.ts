import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Support extends Command {
    public constructor() {
        super('support', {
            aliases: ['support', 'S'],
            channel: 'dm',
        });
    }
    public async exec(message: Message) {
        console.log(message.util);
    }
}
