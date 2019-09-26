import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel } from 'discord.js';
import { lobbyStoresRooms } from '../../../utils/lobby';

export default class Delete extends Listener {
    public constructor() {
        super('channelDelete', {
            emitter: 'client',
            event: 'channelDelete',
        });
    }

    public exec = async (channel: DMChannel | GuildChannel) => {
        const room = lobbyStoresRooms.get(channel.id);
        if (room) {
            console.log('CHANNEL DELETED');
            await room.deactivate();
            await room.LS.updateFastAppeal();
        }
    }

}
