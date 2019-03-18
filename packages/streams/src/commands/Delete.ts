import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Delete extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('delete', {
            aliases: ['delete'],
        });
    }
    public exec(message: Message, args) {
        console.log('Delete -> publicexec -> message', message);
    }
}
