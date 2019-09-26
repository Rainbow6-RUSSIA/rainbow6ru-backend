import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel } from 'discord.js';

export default class Delete extends Listener {
    public constructor() {
        super('channelDelete', {
            emitter: 'client',
            event: 'channelDelete',
        });
    }

    public exec = async (channel: DMChannel | GuildChannel) => {
        if (channel instanceof GuildChannel) {
            console.log('CHANNEL DELETED');
        }
    }

}
