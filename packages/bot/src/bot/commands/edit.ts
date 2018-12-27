import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Edit extends Command {
    public constructor() {
        super('edit', {
            aliases: ['edit', 'E'],
        });
    }
    public exec(message: Message) {
        console.log('​Edit -> publicexec -> message', message);
    }
}
