import { DMReply } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import 'reflect-metadata';
import { lobbyStoresRooms } from '../lobby';
import { LSRoom } from '../lobby/room';

export interface IArgsPartyCommand {
    room?: LSRoom;
}

export default function PartyCommand(skipLeadership: boolean = false) {
    return <T extends Command, K extends keyof T>(target: Pick<T, keyof T>, propertyName: K, propertyDesciptor: TypedPropertyDescriptor<T['exec']>) => {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(message: Message, args) {
            const room = lobbyStoresRooms.get(message.member.voice.channelID);
            if (room.LS.lfgChannel.id !== message.channel.id) {
                return DMReply(message, 'Команды пати доступны только в канале поиска игровой категории!');
            } else {
                if (!message.member.permissions.has('MANAGE_ROLES') && !skipLeadership && room.dcLeader && room.dcLeader.id !== message.author.id) {
                    return DMReply(message, `Команды пати доступны только для ${room.dcLeader} - лидера лобби`);
                }
                return method.apply(this, [message, { room, ...args }]);
            }
        };

        return propertyDesciptor;
    };
}
