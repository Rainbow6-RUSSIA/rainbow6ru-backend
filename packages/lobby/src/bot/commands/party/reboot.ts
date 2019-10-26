import { Guild } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, TextChannel, VoiceChannel } from 'discord.js';
import { debug } from '../../..';
import { LobbyStore, lobbyStores, lobbyStoresRooms } from '../../../utils/lobby';
import { LSRoom } from '../../../utils/lobby/room';

interface IArgs {
    target: VoiceChannel;
}

export default class Reboot extends Command {
    public constructor() {
        super('reboot', {
            aliases: ['reboot'],
            args: [{
                id: 'target',
                type: 'voiceChannel',
            }],
            channel: 'guild',
            cooldown: 5000,
            userPermissions: 'MANAGE_GUILD',
        });
    }

    public exec = async (message: Message, args: IArgs) => {
        const dbGuild = await Guild.findByPk(message.guild.id);
        const channel = message.channel as TextChannel;
        if (args.target) {
            const room = lobbyStoresRooms.get(args.target.id);
            if (room) {
                await room.deactivate();
                lobbyStoresRooms.set(room.dcChannel.id, await new LSRoom(room.dcChannel, room.LS).init());
                await room.LS.updateFastAppeal();
                return message.reply('комната перезагружена.');
            } else {
                return message.reply('данный голосовой канал не отслеживается.');
            }
        } else {
            if (lobbyStores.has(channel.id)) {
                const LS = lobbyStores.get(channel.id);
                lobbyStores.set(channel.id, await new LobbyStore(LS.settings, dbGuild).init());
                debug.log(`лобби \`${LS.settings.type}\` на ${message.guild.name} перезагружено`);
                return message.reply(`\`${LS.settings.type}\` лобби перезагружено`);
            } else {
                return message.reply('команда доступна только в канале поиска!');
            }
        }
    }
}
