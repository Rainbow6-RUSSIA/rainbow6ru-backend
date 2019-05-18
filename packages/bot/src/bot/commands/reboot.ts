import { Guild } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../..';
import { LobbyStore, lobbyStores } from '../lobby';

export default class Reboot extends Command {
    public constructor() {
        super('reboot', {
            aliases: ['reboot'],
            channel: 'guild',
            cooldown: 5000,
            ownerOnly: true,
        });
    }

    public exec = async (message: Message) => {
        const dbGuild = await Guild.findByPk(message.guild.id);
        Object.entries(dbGuild.voiceCategories).map((ent) => lobbyStores.set(ent[1], new LobbyStore(ent[1], ent[0], dbGuild)));
        return message.reply('перезагружаем лобби');
    }
}
