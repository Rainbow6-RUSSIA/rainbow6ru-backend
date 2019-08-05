import { Guild as G } from '@r6ru/db';
import { VERIFICATION_LEVEL } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';
import { debug } from '../../..';
import ENV from '../../../utils/env';

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
            donateRoles: {
                default: [guild.roles.highest.id, 0, 'Default', []],
            },
            id: guild.id,
            lfgChannels: {},
            logsChannel: '',
            platformRoles: {},
            premium: false,
            requiredVerification: VERIFICATION_LEVEL.NONE,
            roomsRange: {
                default: [0, 5],
            },
            voiceCategories: {},
        }).save();
    }
}
