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
            if (!message.member.voice.channelID) {
                try {
                    message.author.send('Вы должны сначала зайти в голосовой канал игровой категории!');
                } catch (error) {
                    (await message.reply(`вы совершаете слишком много действий! Умерьте пыл, или вы будете временно отстранены!`) as Message).delete({ timeout: 30000 });
                }
                return;
            }
            const channel = message.channel as TextChannel;
            if (!lobbyStores.has(channel.parentID)) {
                try {
                    message.author.send('Команды пати доступны только в соответствующем канале поиска игровой категории!');
                } catch (error) {
                    (await message.reply(`команды пати доступны только в соответствующем канале поиска игровой категории!`) as Message).delete({ timeout: 30000 });
                }
                return;
            } else {
                const LS = lobbyStores.get(channel.parentID);
                const lobby = LS.lobbies.get(message.member.voice.channelID);
                if (!lobby) {
                    try {
                        message.author.send('Вы должны сначала зайти в голосовой канал игровой категории!');
                    } catch (error) {
                        (await message.reply(`вы должны сначала зайти в голосовой канал игровой категории!`) as Message).delete({ timeout: 30000 });
                    }
                    return;
                }
                if (!message.member.permissions.has('MANAGE_ROLES') && !skipLeadership && lobby.dcLeader && lobby.dcLeader.id !== message.author.id) {
                    try {
                        message.author.send(`Команды пати доступны только для ${lobby.dcLeader} - лидера лобби`);
                    } catch (error) {
                        (await message.reply(`команды пати доступны только для ${lobby.dcLeader} - лидера лобби`) as Message).delete({ timeout: 30000 });
                    }
                    return;
                }
                if (Object.entries(LS.guild.lfgChannels).find((ent) => ent[1] === channel.id)[0] !== Object.entries(LS.guild.voiceCategories).find((ent) => ent[1] === channel.parentID)[0]) {
                    try {
                        message.author.send('Команды пати доступны только в соответствующем канале поиска игровой категории!');
                    } catch (error) {
                        (await message.reply(`Команды пати доступны только в соответствующем канале поиска игровой категории!`) as Message).delete({ timeout: 30000 });
                    }
                    return;
                }
                return method.apply(this, [message, { lobby, LS, ...args }]);
            }
        };

        return propertyDesciptor;
    };
}
