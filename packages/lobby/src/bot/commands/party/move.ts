import { Guild, Lobby } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, TextChannel, VoiceChannel } from 'discord.js';
import { debug } from '../../..';
import { LobbyStore, lobbyStores, lobbyStoresRooms } from '../../../utils/lobby';
import { LSRoom } from '../../../utils/lobby/room';
import { IngameStatus } from '@r6ru/types';

interface IArgs {
    targetId: string;
    gameMode: string;
}

export default class Move extends Command {
    public constructor() {
        super('move', {
            aliases: ['move', 'mv'],
            args: [{
                id: 'targetId',
                type: 'string'
            }, {
                id: 'gameMode',
                type: 'string'
            }],
            channel: 'guild',
            cooldown: 5000,
            userPermissions: 'MANAGE_GUILD',
        });
    }

    public exec = async (message: Message, args: IArgs) => {
        const { targetId, gameMode } = args;
        if (targetId && gameMode) {
            const room = lobbyStoresRooms.find(r => r.dcChannel.id === targetId || r.id === parseInt(targetId));
            try {
                if (room) {
                    const IS = IngameStatus[gameMode]
                    await room.moveTo(IS || gameMode);
                    return message.reply('комната перемещена.');
                } else {
                    return message.reply('данный голосовой канал не отслеживается.');
                }
            } catch (error) {
                return message.reply('целевая категория не найдена.');
            }
        } else {
            return message.reply('укажите аргументы правильно!');
        }
    }
}
