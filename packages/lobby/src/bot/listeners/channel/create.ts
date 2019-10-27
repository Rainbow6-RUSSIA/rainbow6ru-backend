import { Guild } from '@r6ru/db';
import { ILobbySettings } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { DMChannel, GuildChannel, VoiceChannel } from 'discord.js';
import { lobbyStores, lobbyStoresRooms } from '../../../utils/lobby';
import { LSRoom } from '../../../utils/lobby/room';

export default class ChannelCreate extends Listener {
    public constructor() {
        super('channelCreate', {
            emitter: 'client',
            event: 'channelCreate',
        });
    }

    public static async handle(voice: VoiceChannel, settigns?: ILobbySettings) {
        // console.log('CHANNEL CREATED');
        if (!settigns) {
            const dbGuild = await Guild.findByPk(voice.guild.id);
            settigns = Object.values(dbGuild.lobbySettings || {}).find(s => s.voiceCategory === voice.parentID); // map(s => s.voiceCategory).includes(channel.parentID)
        }
        if (settigns) {
            const LS = lobbyStores.get(settigns.lfg);
            const room = await new LSRoom(voice, LS).init();
            lobbyStoresRooms.set(voice.id, room);
            await LS.updateFastAppeal();
        }
    }

    public async exec(channel: DMChannel | GuildChannel) {
        const room = lobbyStoresRooms.get(channel.id);
        if (channel instanceof VoiceChannel && !room) {
            await ChannelCreate.handle(channel);
        }
    }

}
