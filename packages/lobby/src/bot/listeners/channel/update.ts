import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel, VoiceChannel } from 'discord.js';
import { lobbyStores, lobbyStoresRooms } from '../../../utils/lobby';
import { LSRoom } from '../../../utils/lobby/room';

export default class Update extends Listener {
    public constructor() {
        super('channelUpdate', {
            emitter: 'client',
            event: 'channelUpdate',
        });
    }

    public exec = async (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => {
        if (oldChannel instanceof VoiceChannel && newChannel instanceof VoiceChannel && oldChannel.parentID !== newChannel.parentID) {
            const room = lobbyStoresRooms.get(oldChannel.id); // from settings to room, not from room to settings
            const settigns = Object.values(room.LS.guild.lobbySettings).find(s => s.voiceCategory === newChannel.parentID);
            if (settigns) {
                const LS = lobbyStores.get(settigns.lfg);
                await room.deactivate();
                const newRoom = await new LSRoom(newChannel, LS).init();
                lobbyStoresRooms.set(newChannel.id, newRoom);
                await Promise.all([
                    room.LS.syncChannels(),
                    newRoom.LS.syncChannels(),
                ]); // refactor to replace with last voice
                await Promise.all([
                    room.LS.updateFastAppeal(),
                    newRoom.LS.updateFastAppeal(),
                ]);
                console.log('CHANNEL UPDATED');
            }
        }
    }

}
