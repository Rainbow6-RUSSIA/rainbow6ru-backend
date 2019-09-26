import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel } from 'discord.js';

export default class Create extends Listener {
    public constructor() {
        super('channelCreate', {
            emitter: 'client',
            event: 'channelCreate',
        });
    }

    public exec = async (channel: DMChannel | GuildChannel) => {
        if (channel instanceof GuildChannel) {
            console.log('CHANNEL CREATED');
        }
    }

}
