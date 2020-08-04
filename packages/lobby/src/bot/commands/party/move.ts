import { Guild, Lobby } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, TextChannel, VoiceChannel } from 'discord.js';
import { debug } from '../../..';
import { LobbyStore, lobbyStores, lobbyStoresRooms } from '../../../utils/lobby';
import { LSRoom } from '../../../utils/lobby/room';
import { IngameStatus } from '@r6ru/types';

interface IArgs {
    target: VoiceChannel;
    targetId: number;
    gameMode: string;
}

export default class Move extends Command {
    public constructor() {
        super('move', {
            aliases: ['move', 'mv'],
            args: [{
                id: 'target',
                type: 'voiceChannel',
                unordered: true,
            }, {
                id: 'targetId',
                type: 'number',
                unordered: true,
            }, {
                id: 'gameMode',
                type: 'string',
                unordered: true
            }],
            channel: 'guild',
            cooldown: 5000,
            userPermissions: 'MANAGE_GUILD',
        });
    }

    public exec = async (message: Message, args: IArgs) => {
        const { target, targetId, gameMode } = args;
        if ((target || targetId) && gameMode ) {
            const room = lobbyStoresRooms.find(r => (target && r.dcChannel.id === target.id) || (targetId && r.id === targetId));
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
