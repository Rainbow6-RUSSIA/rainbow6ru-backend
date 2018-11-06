import { Inhibitor } from 'discord-akairo';

export default class GuildBlacklist extends Inhibitor {
    constructor() {
        super('blacklist', {
            reason: 'blacklist',
        });
    }
    public exec(message) {
        return message.guild.id !== '216649610511384576';
    }
}
