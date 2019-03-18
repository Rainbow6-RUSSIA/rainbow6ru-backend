import { Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';
import { User } from '@r6ru/db';

export default class Ownership extends Inhibitor {
    constructor() {
        super('ownership', {
            reason: 'ownership'
        })
    }

    public async exec(message: Message) {
        let owner = await User.findByPk(message.author.id);
        if (!owner) {
            message.reply('сначала зарегистрируйтесь в боте');
            return true;
        }
        return false;
    }
}
