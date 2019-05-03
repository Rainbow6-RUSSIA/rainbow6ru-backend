import { Lobby } from '@r6ru/db';
import { TryCatch } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { debug } from '../..';
import embeds from '../../utils/embeds';
import ENV from '../../utils/env';
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

    @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        if (!message.member.voice.channelID) { return message.author.send('вы должны сначала зайти в голосовой канал игровой категории'); }
        const channel = message.channel as TextChannel;
        if (!lobbyStores.has(channel.parentID)) {
            return message.author.send('поиск пати доступен только в соответствующем канале поиска игровой категории!');
        } else {
            const LS = lobbyStores.get(channel.parentID);
            const lobby = LS.lobbies.find((l) => l.channel === message.member.voice.channelID);
            if (lobby.dcLeader.id !== message.author.id) {
                return message.author.send(`поиск пати доступен только для <@${lobby.dcLeader.id}> - лидера лобби`);
            }
            if (Object.entries(LS.guild.lfgChannels).find((ent) => ent[1] === channel.id)[0] !== Object.entries(LS.guild.voiceCategories).find((ent) => ent[1] === channel.parentID)[0]) {
                return message.author.send('поиск пати нужно проводить в соответствующем канале поиска!');
            }
            const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE) });
            lobby.invite = inv.url;
            lobby.description = args.description;
            await lobby.save();
            lobby.dcInvite = inv;
            lobby.appealMessage = await LS.lfgChannel.send('@here', { embed: embeds.appealMsg(lobby) }) as Message;
        }
        return message.delete();
    }
}
