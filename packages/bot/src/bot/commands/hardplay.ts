import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../..';
import PartyCommand, { IArgsPartyCommand } from '../../utils/decorators/party_command';

export default class HardPlay extends Command {
    public constructor() {
        super('hardplay', {
            aliases: ['HP', 'hardplay'],
            channel: 'guild',
        });
    }

    @PartyCommand()
    public async exec(message: Message, args: IArgsPartyCommand) {
        const { lobby, LS } = args;
        lobby.hardplay = !lobby.hardplay;
        await lobby.save();
        const vc = message.member.voice.channel;
        if (lobby.hardplay) {
            await vc.setName(vc.name.replace('HardPlay ', ''));
        } else {
            await vc.setName(vc.name.replace(' ', ' HardPlay '));
        }
        lobby.dcChannel = vc;
        await LS.updateAppealMsg(lobby);
        debug.log(`${message.author} ${lobby.hardplay ? 'деактивировал' : 'активировал'} HardPlay лобби!. ID пати \`${lobby.id}\``);
        try {
            message.author.send(`HardPlay лобби ${lobby.hardplay ? 'деактивировано' : 'активировано'}!`);
        } catch (error) {
            (await message.reply(`HardPlay лобби ${lobby.hardplay ? 'деактивировано' : 'активировано'}!`) as Message).delete({ timeout: 30000 });
        }
    }
}
