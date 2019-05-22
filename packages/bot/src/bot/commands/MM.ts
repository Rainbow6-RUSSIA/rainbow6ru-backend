import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../..';
import PartyCommand, { IArgsPartyCommand } from '../../utils/decorators/party_command';
import embeds from '../../utils/embeds';
import ENV from '../../utils/env';

interface IArgs extends IArgsPartyCommand {
    description: string;
}

export default class MM extends Command {
    public constructor() {
        super('MM', {
            aliases: ['MM', 'party'],
            args: [{
                id: 'description',
                match: 'text',
                type: 'string',
            }],
            channel: 'guild',
        });
    }

    @PartyCommand()
    public async exec(message: Message, args: IArgs) {
        const { description, lobby, LS  } = args;
        const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE) });
        lobby.invite = inv.url;
        lobby.description = description;
        await lobby.save();
        lobby.dcInvite = inv;
        if (lobby.appealMessage && !lobby.appealMessage.deleted) {
            await lobby.appealMessage.delete();
        }
        lobby.appealMessage = await LS.lfgChannel.send('@here', await embeds.appealMsg(lobby)) as Message;
        return debug.log(`<@${message.author.id}> ищет пати в \`${lobby.type}\` с описанием: \`${lobby.description}\`. ID пати \`${lobby.id}\``);
    }
}
