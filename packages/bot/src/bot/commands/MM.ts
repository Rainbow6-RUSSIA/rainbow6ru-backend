import { Lobby } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { debug } from '../..';
import embeds from '../../utils/embeds';
import ENV from '../../utils/env';
import { lobbyStores } from '../lobby';

interface IArgs {
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

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        if (!message.member.voice.channelID) { return message.author.send('вы должны сначала зайти в голосовой канал игровой категории!'); }
        const channel = message.channel as TextChannel;
        if (!lobbyStores.has(channel.parentID)) {
            return message.author.send('поиск пати доступен только в соответствующем канале поиска игровой категории!');
        } else {
            const LS = lobbyStores.get(channel.parentID);
            const lobby = LS.lobbies.find((l) => l.channel === message.member.voice.channelID);
            if (!lobby) {
                return message.author.send('вы должны сначала зайти в голосовой канал игровой категории!');
            }
            if (lobby.dcLeader && lobby.dcLeader.id !== message.author.id) {
                return message.author.send(`поиск пати доступен только для <@${lobby.dcLeader.id}> - лидера лобби`);
            }
            if (Object.entries(LS.guild.lfgChannels).find((ent) => ent[1] === channel.id)[0] !== Object.entries(LS.guild.voiceCategories).find((ent) => ent[1] === channel.parentID)[0]) {
                return message.author.send('поиск пати нужно проводить в соответствующем канале поиска!');
            }
            if (!lobby.dcLeader) {
                lobby.dcLeader = message.member;
            }
            const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE) });
            lobby.invite = inv.url;
            lobby.description = args.description;
            await lobby.save();
            lobby.dcInvite = inv;
            await (lobby.appealMessage && !lobby.appealMessage.deleted && lobby.appealMessage.delete());
            lobby.appealMessage = await LS.lfgChannel.send('@here', await embeds.appealMsg(lobby)) as Message;
            return debug.log(`<@${message.author.id}> ищет пати в \`${lobby.type}\` с описанием: \`${lobby.description}\`. ID пати \`${lobby.id}\``);
        }
        // return message.delete();
    }
}
