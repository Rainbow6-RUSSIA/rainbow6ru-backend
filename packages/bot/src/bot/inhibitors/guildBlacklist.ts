import { Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';

export default class GuildBlacklist extends Inhibitor {
    public constructor() {
        super('blacklist', {
            reason: 'blacklist',
        });
    }
    public exec(message: Message) {
        return message.guild.id !== '216649610511384576';
    }
}
