import { TryCatch } from '@r6ru/utils';
import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';
import { debug } from '../../..';

export default class Delete extends Listener {
    public constructor() {
        super('delete', {
            emitter: 'client',
            event: 'guildDelete',
        });
    }

    @TryCatch(debug)
    public exec = async (guild: Guild) => {
        console.log('​Delete -> publicexec -> guild', guild);
    }
}
