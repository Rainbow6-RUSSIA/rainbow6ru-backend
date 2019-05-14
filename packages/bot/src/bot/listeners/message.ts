import { Listener } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { lobbyStores } from '../../utils/lobby';

export default class MSG extends Listener {
    public constructor() {
        super('message', {
            emitter: 'client',
            event: 'message',
        });
    }

// @TryCatch(debug)
    public exec = async (message: Message) => {
        if (!message.author.bot
                &&
            message.type === 'DEFAULT'
                &&
            message.channel.type === 'text'
                &&
            (message.channel as TextChannel).parentID
                &&
            lobbyStores.has((message.channel as TextChannel).parentID)
                &&
            !message.member.permissions.has('MANAGE_ROLES')) {
            await message.delete();
        }
    }
}
