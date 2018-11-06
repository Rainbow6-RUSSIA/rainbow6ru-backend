import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Rank extends Command {
    public constructor() {
        super('rank', {
            aliases: ['rank', 'rang', 'R'],

        });
    }
    public exec(message: Message) {
        console.log('rank used');
    }
}
