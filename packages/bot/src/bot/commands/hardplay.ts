import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../..';
import PartyCommand, { IArgsPartyCommand } from '../../utils/decorators/party_command';

export default class MM extends Command {
    public constructor() {
        super('hardplay', {
            aliases: ['HP', 'hardplay'],
            channel: 'guild',
        });
    }

    @PartyCommand()
    public async exec(message: Message, args: IArgsPartyCommand) {
        const { lobby, LS } = args;
        lobby.open = !lobby.open;
        await lobby.save();
        debug.log(`${message.author.id} ${lobby.open ? 'деактивировал' : 'активировал'} HardPlay лобби!. ID пати \`${lobby.id}\``);
        try {
            message.author.send(`HardPlay лобби ${lobby.open ? 'деактивировано' : 'активировано'}!`);
        } catch (error) {
            message.reply(`HardPlay лобби ${lobby.open ? 'деактивировано' : 'активировано'}!`);
        }
    }
}