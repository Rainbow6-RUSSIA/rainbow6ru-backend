import { Command } from 'discord-akairo';
import { Message, VoiceChannel } from 'discord.js';
import { lobbyStoresRooms } from '../../../utils/lobby';

interface IArgs {
    target: VoiceChannel;
}

export default class Debug extends Command {
    public constructor() {
        super('debug', {
            aliases: ['debug'],
            args: [
                {
                    id: 'target',
                    type: 'voiceChannel',
                },
            ],
            channel: 'guild',
            userPermissions: 'MANAGE_ROLES',
        });
    }

    // @RequireVoice
    // @PartyCommand()
    public async exec(message: Message, args: IArgs) {
        const { target } = args;
        console.log(lobbyStoresRooms.get(target?.id || message.member.voice.channelID));
    }
}
