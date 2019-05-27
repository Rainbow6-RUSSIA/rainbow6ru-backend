import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../..';
import PartyCommand, { IArgsPartyCommand } from '../../utils/decorators/party_command';

export default class MM extends Command {
    public constructor() {
        super('close', {
            aliases: ['close'],
            channel: 'guild',
        });
    }

    @PartyCommand()
    public async exec(message: Message, args: IArgsPartyCommand) {
        const { lobby, LS } = args;
        lobby.open = !lobby.open;
        await lobby.save();
        const vc = message.member.voice.channel;
        if (lobby.open) {
            // await vc.setName(vc.name.replace('HardPlay ', ''));
        } else {
            // await vc.setName(vc.name.replace(' ', ' HardPlay '));
        }
        debug.log(`${message.author} ${lobby.open ? 'открыл' : 'закрыл'} лобби!. ID пати \`${lobby.id}\``);
        try {
            message.author.send(`Лобби ${lobby.open ? 'открыто' : 'закрыто'}!`);
        } catch (error) {
            (await message.reply(`лобби ${lobby.open ? 'открыто' : 'закрыто'}!`) as Message).delete({ timeout: 30000 });
        }
    }
}
