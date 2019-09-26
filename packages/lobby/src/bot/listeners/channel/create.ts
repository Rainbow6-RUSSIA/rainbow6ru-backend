import { Guild } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel, VoiceChannel } from 'discord.js';
import { lobbyStores, lobbyStoresRooms } from '../../../utils/lobby';
import { LSRoom } from '../../../utils/lobby/room';

export default class Create extends Listener {
    public constructor() {
        super('channelCreate', {
            emitter: 'client',
            event: 'channelCreate',
        });
    }

    public exec = async (channel: DMChannel | GuildChannel) => {
        if (channel instanceof VoiceChannel) {
            console.log('CHANNEL CREATED');
            const dbGuild = await Guild.findByPk(channel.guild.id);
            const settigns = Object.values(dbGuild.lobbySettings).find(s => s.voiceCategory === channel.parentID); // map(s => s.voiceCategory).includes(channel.parentID)
            if (settigns) {
                const LS = lobbyStores.get(settigns.lfg);
                const room = await new LSRoom(channel, LS).init();
                lobbyStoresRooms.set(channel.id, room);
                await LS.updateFastAppeal();
            }
        }
    }

}
