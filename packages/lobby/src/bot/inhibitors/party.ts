import { Command, Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';
import DetectLS from '../../utils/decorators/detect_ls';

export default class LFGPurge extends Inhibitor {
    constructor() {
        super('party', {
            reason: 'party',
        });
    }

    @DetectLS
    public async exec(message: Message, cmd: Command) {
        if (message.member.permissions.has('MANAGE_ROLES')) {
            try {
                await message.delete();
            } catch (error) {
                // console.log
            }
        }
        if (cmd.categoryID !== 'party') {
            return true;
        }
        return false;
    }
}
