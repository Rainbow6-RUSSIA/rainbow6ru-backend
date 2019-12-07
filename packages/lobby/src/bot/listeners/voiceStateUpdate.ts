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

        const internal = A && B && A.LS.settings.type === B.LS.settings.type;
        const jump = internal && A.dcMembers.size === 0 && B.dcMembers.size === 1;

        await (A?.dcMembers.size === 0 && !jump && A?.LS.reportLeave(A, internal));
        await A?.leave(newState.member, internal);

        await (B?.dcMembers.size === 1 && !jump && B?.LS.reportJoin(B, internal));
        await B?.join(newState.member, internal);

        await (internal || A?.LS.updateFastAppeal());
        await B?.LS.updateFastAppeal();
    }

    public exec = async (oldState: VoiceState, newState: VoiceState) => {
        if (ENV.NODE_ENV === 'development' && oldState.guild.id !== '216649610511384576' || (oldState?.channelID === newState.channelID)) {return; }
        if (!newState.channel && newState.channelID) {
            await this.client.channels.fetch(newState.channelID);
        }
        if (!oldState.channel && oldState.channelID) {
            await this.client.channels.fetch(oldState.channelID);
        }
        VoiceStateUpdate.handle(oldState, newState);
    }
}
