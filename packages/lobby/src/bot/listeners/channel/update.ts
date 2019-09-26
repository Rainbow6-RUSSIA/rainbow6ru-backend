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
        if (oldChannel instanceof VoiceChannel && newChannel instanceof VoiceChannel) {
            console.log('CHANNEL UPDATED');
            const room = lobbyStoresRooms.get(oldChannel.id);
            if (room && oldChannel.parentID !== newChannel.parentID) {
                const settigns = Object.values(room.LS.guild.lobbySettings).find(s => s.voiceCategory === newChannel.parentID);
                if (settigns) {
                    const LS = lobbyStores.get(settigns.lfg);
                    await room.deactivate();
                    const newRoom = await new LSRoom(newChannel, LS).init();
                    lobbyStoresRooms.set(newChannel.id, newRoom);
                    await room.LS.updateFastAppeal();
                    await newRoom.LS.updateFastAppeal();
                }
            }
        }
    }

}
