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
        debug.warn(`​Delete -> publicexec -> guild ${guild.id} ${guild.name}`);
    }
}
