import { Lobby } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { lobbyStores } from '../../utils/lobby';

interface IArgs {
    description: string;
}

export default class MM extends Command {
    public constructor() {
        super('MM', {
            aliases: ['MM', 'party'],
            args: [{
                id: 'description',
                type: 'string',
            }],
            channel: 'guild',
        });
    }
    public exec(message: Message, args: IArgs) {
        if (!message.member.voice.channelID) { return message.reply('вы должны сначала зайти в голосовой канал игровой категории'); }
        const channel = message.channel as TextChannel;
        if (!lobbyStores.has(channel.parentID)) {
            return message.reply('поиск пати доступен только в соответствующем канале поиска игровой категории!');
        } else {
            const LS = lobbyStores.get(channel.parentID);
            if (Object.entries(LS.guild.lfgChannels).find((ent) => ent[1] === channel.id)[0] !== Object.entries(LS.guild.voiceCategories).find((ent) => ent[1] === channel.parentID)[0]) {
                return message.reply('поиск пати нужно проводить в соответствующем канале поиска!');
            }

        }
    }
}
