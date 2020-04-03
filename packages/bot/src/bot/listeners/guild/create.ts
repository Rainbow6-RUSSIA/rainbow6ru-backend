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

        const {members, channels, emojis, roles, voiceStates, presences, ...other} = guild;
        console.log('​Create -> publicexec -> guild', other);

        await new G({
            donateRoles: {
                default: [guild.roles.highest.id, 0, 'Default', []],
            },
            id: guild.id,
            lobbySettings: {},
            logsChannel: '',
            platformRoles: {},
            premium: false,
            requiredVerification: VERIFICATION_LEVEL.NONE,
        }).save();

    }
}
