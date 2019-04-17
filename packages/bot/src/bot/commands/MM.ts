import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class MM extends Command {
    public constructor() {
        super('MM', {
            aliases: ['MM', 'party'],
        });
    }
    public exec(message: Message) {
        console.log('​MM -> publicexec -> message', message);
    }
}
