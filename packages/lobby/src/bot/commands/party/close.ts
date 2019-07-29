import { DMReply } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../../..';
import PartyCommand, { IArgsPartyCommand } from '../../../utils/decorators/party_command';
import RequireVoice from '../../../utils/decorators/require_voice';

export default class MM extends Command {
    public constructor() {
        super('close', {
            aliases: ['close'],
            channel: 'guild',
        });
    }

    @RequireVoice
    @PartyCommand()
    public async exec(message: Message, args: IArgsPartyCommand) {
        const { lobby, LS } = args;
        lobby.open = !lobby.open;
        await lobby.save();
        const vc = lobby.dcChannel; // message.member.voice.channel;
        await vc.setUserLimit(lobby.open ? LS.roomSize : vc.members.size); // (vc.name.replace('HardPlay ', ''));
        await LS.updateAppealMsg(lobby);
        debug.log(`${message.author} ${lobby.open ? 'открыл' : 'закрыл'} лобби!. ID пати \`${lobby.id}\``);

        return DMReply(message, `Лобби ${lobby.open ? 'открыто' : 'закрыто'}!`);

    }
}