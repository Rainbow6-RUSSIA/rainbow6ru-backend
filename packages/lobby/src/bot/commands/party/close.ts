import { EmojiButtons } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import PartyCommand, { IArgsPartyCommand } from '../../../utils/decorators/party_command';
import RequireVoice from '../../../utils/decorators/require_voice';

export default class MM extends Command {
    public constructor() {
        super('close', {
            aliases: ['close', 'open'],
            channel: 'guild',
        });
    }

    @RequireVoice
    @PartyCommand()
    public async exec(message: Message, args: IArgsPartyCommand) {
        const { room } = args;
        return room.handleAction(EmojiButtons.CLOSE, !room.close);
    }
}
