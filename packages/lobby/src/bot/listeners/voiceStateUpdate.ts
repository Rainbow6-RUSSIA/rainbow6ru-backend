import { Listener } from 'discord-akairo';
import { VoiceState } from 'discord.js';
import ENV from '../../utils/env';
import { lobbyStoresRooms } from '../../utils/lobby';

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }

    public static async handle(oldState: VoiceState, newState: VoiceState) {
        const A = lobbyStoresRooms.get(oldState.channelID);
        const B = lobbyStoresRooms.get(newState.channelID);

        await (A && A.leave(newState.member, A && B && A.LS.settings.type === B.LS.settings.type));
        await (B && B.join(newState.member, A && B && A.LS.settings.type === B.LS.settings.type));
    }

    public exec = async (oldState: VoiceState, newState: VoiceState) => {
        if (ENV.NODE_ENV === 'development' && oldState.guild.id !== '216649610511384576') {return; }
        if (!newState.channel && newState.channelID) {
            await this.client.channels.fetch(newState.channelID);
        }
        if (!oldState.channel && oldState.channelID) {
            await this.client.channels.fetch(oldState.channelID);
        }
        VoiceStateUpdate.handle(oldState, newState);
    }
}
