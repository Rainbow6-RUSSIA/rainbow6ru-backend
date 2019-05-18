import { Listener } from 'discord-akairo';
import { VoiceState } from 'discord.js';
import { lobbyStores } from '../lobby';

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }

    public exec = async (oldState: VoiceState, newState: VoiceState) => {
        switch (true) {
            case !oldState.channelID && Boolean(newState.channelID): {
                if (!lobbyStores.has(newState.channel.parentID)) { return; }
                lobbyStores
                    .get(newState.channel.parentID)
                    .join(newState.member, newState.channel);
                break;
            }
            case oldState.channelID && !newState.channelID: {
                if (!lobbyStores.has(oldState.channel.parentID)) { return; }
                lobbyStores
                    .get(oldState.channel.parentID)
                    .leave(oldState.member, oldState.channel);
                break;
            }
            case oldState.channelID && newState.channelID && oldState.channelID !== newState.channelID && (lobbyStores.has(oldState.channel.parentID) || lobbyStores.has(newState.channel.parentID)): {
                switch (true) {
                    case !lobbyStores.has(oldState.channel.parentID): {
                        lobbyStores
                            .get(newState.channel.parentID)
                            .join(newState.member, newState.channel);
                        break;
                    }
                    case !lobbyStores.has(newState.channel.parentID): {
                        lobbyStores
                            .get(oldState.channel.parentID)
                            .leave(oldState.member, oldState.channel);
                        break;
                    }
                    case oldState.channel.members.size === 0 ? newState.channel.members.size !== 1 : newState.channel.members.size === 1 : {
                        const LS = lobbyStores.get(newState.channel.parentID);
                        await LS.leave(newState.member, oldState.channel);
                        await LS.join(newState.member, newState.channel);
                        break;
                    }
                    default: {
                        lobbyStores.get(newState.channel.parentID).internal(newState.member, oldState.channel, newState.channel);
                        break;
                    }
                }
                break;
            }
            default:
                break;
        }
    }
}
