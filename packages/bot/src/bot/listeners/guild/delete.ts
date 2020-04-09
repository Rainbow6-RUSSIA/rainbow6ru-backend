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
        const {members, channels, emojis, roles, voiceStates, presences, ...other} = guild;
        console.log('​Create -> publicexec -> guild', other);
    }
}
