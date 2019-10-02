import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Eval extends Command {
    constructor() {
        super('eval', {
            aliases: ['eval'],
            args: [{
                id: 'code',
                type: 'string',
            }],
            cooldown: 5000,
            ownerOnly: true,
        });
    }

    public exec = async (message: Message, args) => {
        // tslint:disable-next-line:no-eval
        eval(args.code);
    }
}
