import { Command, Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';
import DetectLS from '../../utils/decorators/detect_ls';

export default class LFGPurge extends Inhibitor {
    constructor() {
        super('lfg', {
            reason: 'lfg',
            type: 'all',
        });
    }

    @DetectLS
    public async exec(message: Message, cmd: Command) {
        if (!message.member.permissions.has('MANAGE_ROLES')) {
            try {
                await message.delete();
            } catch (error) {
                // return true;
            }
        }
        return false;
    }
}
