import { Guild } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { debug } from '../../..';
import { LobbyStore, lobbyStores } from '../../../utils/lobby';

export default class Reboot extends Command {
    public constructor() {
        super('reboot', {
            aliases: ['reboot'],
            channel: 'guild',
            cooldown: 5000,
            userPermissions: 'MANAGE_GUILD',
        });
    }

    public exec = async (message: Message) => {
        const dbGuild = await Guild.findByPk(message.guild.id);
        const channel = message.channel as TextChannel;
        if (lobbyStores.has(channel.id)) {
            const LS = lobbyStores.get(channel.id);
            lobbyStores.set(channel.id, new LobbyStore(LS.settings, dbGuild));
            debug.log(`лобби \`${LS.settings.type}\` на ${message.guild.name} перезагружено`);
            return message.reply(`перезагружаем \`${LS.settings.type}\` лобби`);
        } else {
            // Object.entries(dbGuild.lobbySettings).map(ent => lobbyStores.set(ent[1].lfg, new LobbyStore(ent[1], dbGuild)));
            // debug.log(`лобби на ${message.guild.name} перезагружены`);
            return message.reply('команда доступна только в канале поиска!');
        }
    }
}
