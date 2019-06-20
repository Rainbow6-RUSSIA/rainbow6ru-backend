import { Guild } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { VoiceState } from 'discord.js';
import ENV from '../../utils/env';
import { lobbyStores } from '../lobby';

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }

    public static async handle(oldState: VoiceState, newState: VoiceState) {
        switch (true) {
            case !oldState.channelID && Boolean(newState.channelID): {
                if (!lobbyStores.has(newState.channel.parentID)) { return; }
                await lobbyStores
                    .get(newState.channel.parentID)
                    .join(newState.member, newState.channel);
                break;
            }
            case oldState.channelID && !newState.channelID: {
                if (!lobbyStores.has(oldState.channel.parentID)) { return; }
                await lobbyStores
                    .get(oldState.channel.parentID)
                    .leave(oldState.member, oldState.channel);
                break;
            }
            // case oldState.channelID === undefined && newState.channelID === null: {
            //     const dbGuild = await Guild.findByPk(newState.guild.id);
            //     await Promise.all(Object.values(dbGuild.voiceCategories).map((id) => {
            //         lobbyStores
            //             .get(id)
            //             .handleForceLeave(newState.id);
            //     }));
            //     break;
            // }
            case oldState.channelID && newState.channelID && oldState.channelID !== newState.channelID && (lobbyStores.has(oldState.channel.parentID) || lobbyStores.has(newState.channel.parentID)): {
                switch (true) {
                    case !lobbyStores.has(oldState.channel.parentID): {
                        await lobbyStores
                            .get(newState.channel.parentID)
                            .join(newState.member, newState.channel);
                        break;
                    }
                    case !lobbyStores.has(newState.channel.parentID): {
                        await lobbyStores
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
                        await lobbyStores.get(newState.channel.parentID).internal(newState.member, oldState.channel, newState.channel);
                        break;
                    }
                }
                break;
            }
            default:
                break;
        }
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
        // console.log({ a: { oldState, newState } });
    }
}
