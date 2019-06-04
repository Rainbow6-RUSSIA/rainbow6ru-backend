import { Lobby } from '@r6ru/db';
import { DMReply } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import 'reflect-metadata';
import { LobbyStore, lobbyStores } from '../../bot/lobby';

export interface IArgsPartyCommand {
    lobby?: Lobby;
    LS?: LobbyStore;
}

export default function PartyCommand(skipLeadership: boolean = false) {
    return <T extends Command, K extends keyof T>(target: Pick<T, keyof T>, propertyName: K, propertyDesciptor: TypedPropertyDescriptor<T['exec']>) => {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(message: Message, args) {
            if (!message.member.voice.channelID) {
                return DMReply(message, 'Вы должны сначала зайти в голосовой канал игровой категории!');
            }
            const channel = message.channel as TextChannel;
            if (!lobbyStores.has(channel.parentID)) {
                return DMReply(message, 'Команды пати доступны только в соответствующем канале поиска игровой категории!');
            } else {
                const LS = lobbyStores.get(channel.parentID);
                const lobby = LS.lobbies.get(message.member.voice.channelID);
                if (!lobby) {
                    return DMReply(message, 'Вы должны сначала зайти в голосовой канал игровой категории!');
                }
                if (!message.member.permissions.has('MANAGE_ROLES') && !skipLeadership && lobby.dcLeader && lobby.dcLeader.id !== message.author.id) {
                    return DMReply(message, `Команды пати доступны только для ${lobby.dcLeader} - лидера лобби`);
                }
                if (Object.entries(LS.guild.lfgChannels).find((ent) => ent[1] === channel.id)[0] !== Object.entries(LS.guild.voiceCategories).find((ent) => ent[1] === channel.parentID)[0]) {
                    return DMReply(message, 'Команды пати доступны только в соответствующем канале поиска игровой категории!');
                }
                return method.apply(this, [message, { lobby, LS, ...args }]);
            }
        };

        return propertyDesciptor;
    };
}
