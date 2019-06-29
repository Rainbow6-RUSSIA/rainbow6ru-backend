import { DMReply } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../../..';
import PartyCommand, { IArgsPartyCommand } from '../../../utils/decorators/party_command';
import RequireVoice from '../../../utils/decorators/require_voice';

export default class HardPlay extends Command {
    public constructor() {
        super('hardplay', {
            aliases: ['HP', 'hardplay'],
            channel: 'guild',
        });
    }

    @RequireVoice
    @PartyCommand()
    public async exec(message: Message, args: IArgsPartyCommand) {
        const { lobby, LS } = args;
        lobby.hardplay = !lobby.hardplay;
        await lobby.save();
        await LS.handleHardplay(lobby);
        await LS.updateAppealMsg(lobby);
        debug.log(`${message.author} ${!lobby.hardplay ? 'деактивировал' : 'активировал'} HardPlay лобби!. ID пати \`${lobby.id}\``);
        return DMReply(message, `HardPlay лобби ${!lobby.hardplay ? 'деактивировано' : 'активировано'}!`);
    }
}
