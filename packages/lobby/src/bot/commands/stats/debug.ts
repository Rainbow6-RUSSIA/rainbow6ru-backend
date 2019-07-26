import { Guild, User } from '@r6ru/db';
import { ONLINE_TRACKER } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message, VoiceChannel } from 'discord.js';
import { debug } from '../../..';
import ENV from '../../../utils/env';
import { lobbyStores } from '../../lobby';

interface IArgs {
    target: VoiceChannel;
}

export default class Debug extends Command {
    public constructor() {
        super('debug', {
            aliases: ['debug'],
            args: [{
                id: 'target',
                type: 'voiceChannel',
            }],
            channel: 'guild',
            userPermissions: 'MANAGE_ROLES',
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        if (ENV.LOBBY_MODE === 'off') { return; }
        const { target } = args;
        const LS = lobbyStores.get(target.parentID);
        console.log(LS.lobbies.get(target.id));
    }
}
