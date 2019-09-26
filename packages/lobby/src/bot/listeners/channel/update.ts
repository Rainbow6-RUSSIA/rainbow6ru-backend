import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel } from 'discord.js';

export default class Update extends Listener {
    public constructor() {
        super('channelUpdate', {
            emitter: 'client',
            event: 'channelUpdate',
        });
    }

    public exec = async (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => {
        if (oldChannel instanceof GuildChannel && newChannel instanceof GuildChannel) {
            console.log('CHANNEL UPDATED');
        }
    }

}
