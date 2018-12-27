import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Update extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('update', {
            aliases: ['update', 'U'],
        });
    }
    public exec(message: Message, args) {
        console.log('​Update -> publicexec -> message', message);
    }
}
