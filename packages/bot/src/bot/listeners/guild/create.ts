import { Guild as G } from '@r6ru/db';
import { VERIFICATION_LEVEL } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';
import { debug } from '../../..';

export default class Create extends Listener {
    public constructor() {
        super('create', {
            emitter: 'client',
            event: 'guildCreate',
        });
    }

    public exec = async (guild: Guild) => {
        console.log('​Create -> publicexec -> guild', guild);
        await new G({
            id: guild.id,
            lfgChannels: {},
            logsChannel: '',
            platformRoles: {},
            premium: false,
            requiredVerification: VERIFICATION_LEVEL.NONE,
            roomsRange: [0, 5],
            voiceCategories: {},
        }).save();
    }
}
