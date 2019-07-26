import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';
import { debug } from '../../..';
import ENV from '../../../utils/env';

export default class Delete extends Listener {
    public constructor() {
        super('delete', {
            emitter: 'client',
            event: 'guildDelete',
        });
    }

    public exec = async (guild: Guild) => {
        if (ENV.LOBBY_MODE === 'only') { return; }
        console.log('​Delete -> publicexec -> guild', guild);
    }
}
