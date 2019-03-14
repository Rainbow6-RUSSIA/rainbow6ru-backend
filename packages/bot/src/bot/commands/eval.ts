import * as util from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import * as utils from '../../utils/utils';

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
        if (false) { console.log(util, utils); }
        // tslint:disable-next-line:no-eval
        eval(args.code);
    }
}
