import { Lobby } from '@r6ru/db';
import { Message, TextChannel } from 'discord.js';
import 'reflect-metadata';
import { LobbyStore, lobbyStores } from '../../bot/lobby';

export interface IArgsPartyCommand {
    lobby: Lobby;
    LS: LobbyStore;
}

export default function PartyCommand(skipLeadership: boolean = false) {
    return (target: any, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor => {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(message: Message, args) {
            if (!message.member.voice.channelID) { return message.author.send('вы должны сначала зайти в голосовой канал игровой категории!'); }
            const channel = message.channel as TextChannel;
            if (!lobbyStores.has(channel.parentID)) {
                return message.author.send('команды пати доступны только в соответствующем канале поиска игровой категории!');
            } else {
                const LS = lobbyStores.get(channel.parentID);
                const lobby = LS.lobbies.get(message.member.voice.channelID);
                if (!lobby) {
                    return message.author.send('вы должны сначала зайти в голосовой канал игровой категории!');
                }
                if (!skipLeadership && lobby.dcLeader && lobby.dcLeader.id !== message.author.id) {
                    return message.author.send(`команды пати доступны только для <@${lobby.dcLeader.id}> - лидера лобби`);
                }
                if (Object.entries(LS.guild.lfgChannels).find((ent) => ent[1] === channel.id)[0] !== Object.entries(LS.guild.voiceCategories).find((ent) => ent[1] === channel.parentID)[0]) {
                    return message.author.send('команды пати доступны только в соответствующем канале поиска игровой категории!');
                }
                if (!lobby.dcLeader) {
                    lobby.dcLeader = message.member;
                }
                return method.apply(this, [message, { lobby, LS, ...args }]);
            }
        };

        return propertyDesciptor;
    };
}
