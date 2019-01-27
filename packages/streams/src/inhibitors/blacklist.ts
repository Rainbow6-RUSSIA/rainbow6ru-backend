import { Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';

class BlacklistInhibitor extends Inhibitor {
    constructor() {
        super('blacklist', {
            reason: 'blacklist'
        })
    }

    public exec(message: Message) {
        // He's a meanie!
        const blacklist = ['81440962496172032'];
        return blacklist.includes(message.author.id);
    }
}

export default BlacklistInhibitor;