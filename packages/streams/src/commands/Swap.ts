import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Swap extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('swap', {
            aliases: ['swap'],
        });
    }
    public exec(message: Message, args) {
        console.log('Swap -> publicexec -> message', message);
    }
}
