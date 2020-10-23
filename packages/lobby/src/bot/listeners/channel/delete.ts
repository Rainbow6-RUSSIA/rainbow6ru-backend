import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel, VoiceChannel } from 'discord.js';
import { lobbyStoresRooms } from '../../../utils/lobby';

export default class ChannelDelete extends Listener {
    public constructor() {
        super('channelDelete', {
            emitter: 'client',
            event: 'channelDelete',
        });
    }

    public static async handle(voice: VoiceChannel) {
        const room = lobbyStoresRooms.get(voice.id);
        if (room) {
            // console.log('CHANNEL DELETED');
            const LS = room.LS;
            const pos = voice.rawPosition;

            const toMove = LS.voices.last();
            try {
                await toMove.edit({
                    name:  LS.settings.roomName?.replace(/{{n}}/, (pos + 1).toString())
                        || toMove.name.replace(/#\d+/g, /#\d+/g.exec(room.dcChannel.name)[0]),
                    position: pos, // на самом деле здесь rawPosition
                }, 'подмена удаленного канала');
                lobbyStoresRooms.get(toMove.id)?.updateAppeal();
            } catch (error) {
                console.log('FAIL ON REPLACE WHEN DELETE', error);
            }
            await room.deactivate();
            // await LS.category.fetch();
            await LS.updateFastAppeal();
        }
    }

    public async exec(channel: DMChannel | GuildChannel) {
        const room = lobbyStoresRooms.get(channel.id);
        if (channel instanceof VoiceChannel && room) {
            await ChannelDelete.handle(channel);
        }
    }

}
