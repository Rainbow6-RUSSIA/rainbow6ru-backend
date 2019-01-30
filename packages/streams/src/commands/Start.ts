import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Start extends Command {
    public constructor() {
        super('start', {
            aliases: ['start', 'S'],
        });
    }
    public exec(message: Message, args) {
        console.log('Start -> publicexec -> message', message);
    }
}
