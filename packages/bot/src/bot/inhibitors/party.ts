import { Guild } from '@r6ru/db';
import { Command, Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';

export default class LFGPurge extends Inhibitor {
    constructor() {
        super('party', {
            reason: 'party',
        });
    }

    public async exec(message: Message, cmd: Command) {
        if (message.channel.type === 'text') {
            const dbGuild = await Guild.findByPk(message.guild.id);
            return Object.values(dbGuild.lfgChannels).includes(message.channel.id);
        }
        return false;
    }
}
