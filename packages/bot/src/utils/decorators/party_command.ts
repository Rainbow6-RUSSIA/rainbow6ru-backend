import { Guild, Lobby } from '@r6ru/db';
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
            const dbGuild = await Guild.findByPk(message.guild.id);
            const LSType = Object.entries(dbGuild.lfgChannels).find(e => e[1] === message.channel.id)[0]; // message.channel as TextChannel;
            const categoryID = dbGuild.voiceCategories[LSType];
            if (!lobbyStores.has(categoryID)) {
                return DMReply(message, 'Команды пати доступны только в канале поиска игровой категории!');
            } else {
                const LS = lobbyStores.get(categoryID);
                const lobby = LS.lobbies.get(message.member.voice.channelID);
                if (!lobby) {
                    return DMReply(message, 'Вы должны сначала зайти в голосовой канал соответствующей игровой категории!');
                }
                if (!message.member.permissions.has('MANAGE_ROLES') && !skipLeadership && lobby.dcLeader && lobby.dcLeader.id !== message.author.id) {
                    return DMReply(message, `Команды пати доступны только для ${lobby.dcLeader} - лидера лобби`);
                }
                return method.apply(this, [message, { lobby, LS, ...args }]);
            }
        };

        return propertyDesciptor;
    };
}
