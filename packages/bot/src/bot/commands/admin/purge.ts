import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';

interface IPurgeArgs {
    target: U;
    number: number;
}

export default class Purge extends Command {
    constructor() {
        super('purge', {
            aliases: ['purge'],
            args: [{
                id: 'target',
                type: 'user',
            }, {
                id: 'number',
                type: 'number',
            }],
            channel: 'guild',
            userPermissions: 'MANAGE_MESSAGES',
        });
    }

    public exec = async (message: Message, args: IPurgeArgs) => {
        const ch = message.channel;
        const pinned = await ch.messages.fetchPinned();
        const msg = await ch.messages.fetch({ limit: 100 });
        /* return ch.bulkDelete */
        console.log(msg
            .filter(m => !pinned.has(m.id) && args.target ? args.target.id === m.author.id : true)
            .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
            .array()
            .slice(0, args.number || undefined)
            .push(message)); // , true);
    }
}
