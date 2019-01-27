import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Start extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('start', {
            aliases: ['start'],
        });
    }
    public exec(message: Message, args) {
        console.log('Start -> publicexec -> message', message);
    }
}
