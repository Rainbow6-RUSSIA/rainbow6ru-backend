import { Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';

export default class GuildBlacklist extends Inhibitor {
    public constructor() {
        super('blacklist', {
            reason: 'blacklist',
        });
    }
    public exec(message: Message) {
        if (message.channel.type === 'dm') { return false; }
        return message.guild.id !== '216649610511384576';
    }
}
