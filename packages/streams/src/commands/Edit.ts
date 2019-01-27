import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Edit extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('edit', {
            aliases: ['edit'],
        });
    }
    public exec(message: Message, args) {
        console.log('Edit -> publicexec -> message', message);
    }
}
