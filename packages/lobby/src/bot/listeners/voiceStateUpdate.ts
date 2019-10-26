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

        const internal = Boolean(A) && Boolean(B) && A.LS.settings.type === B.LS.settings.type;
        // console.log('VSU', Boolean(A), Boolean(B), A && A.LS.settings.type, B && B.LS.settings.type);

        await (A && A.leave(newState.member, internal));
        await (A && A.dcMembers.size === 0 && A.LS.reportLeave(A, internal));

        await (B && B.join(newState.member, internal));
        await (B && B.dcMembers.size === 1 && B.LS.reportJoin(B, internal));

        await (internal || A && A.LS.updateFastAppeal());
        await (B && B.LS.updateFastAppeal());
    }

    public exec = async (oldState: VoiceState, newState: VoiceState) => {
        if (ENV.NODE_ENV === 'development' && oldState.guild.id !== '216649610511384576' || (oldState && oldState.channelID === newState.channelID)) {return; }
        if (!newState.channel && newState.channelID) {
            await this.client.channels.fetch(newState.channelID);
        }
        if (!oldState.channel && oldState.channelID) {
            await this.client.channels.fetch(oldState.channelID);
        }
        VoiceStateUpdate.handle(oldState, newState);
    }
}
