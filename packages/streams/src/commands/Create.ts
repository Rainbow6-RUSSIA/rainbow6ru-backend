import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Create extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('create', {
            aliases: ['create'],
        });
    }
    public exec(message: Message, args) {
        console.log('Create -> publicexec -> message', message);
    }
}
