import { Guild as G, Lobby, User as U } from '@r6ru/db';
import { TryCatch } from '@r6ru/utils';
import { Listener } from 'discord-akairo';
import { CategoryChannel, Guild, GuildMember, Snowflake, VoiceChannel, VoiceState } from 'discord.js';
import { EventEmitter } from 'events';
import { debug } from '../..';
import { lobbyStores } from '../../utils/lobby';

export default class VoiceStateUpdate extends Listener {
    public constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    }

    @TryCatch(debug)
    public exec = async (oldState: VoiceState, newState: VoiceState) => {
        if (!(oldState.guild.id === '216649610511384576' || newState.guild.id === '216649610511384576')) { return; }
        // console.log('OLD', oldState);
        // console.log('NEW', newState);
        // if (oldState.guild.id) { return; }

        switch (true) {
            case !oldState.channelID && Boolean(newState.channelID): {
                if (!lobbyStores.has(newState.channel.parentID)) { return; }
                // if (newState.channel.members.size)
                console.log('join', newState.channel.members.size);
                lobbyStores.get(newState.channel.parentID).join(newState.member, newState.channel);
                break;
            }
            case oldState.channelID && !newState.channelID: {
                if (!lobbyStores.has(oldState.channel.parentID)) { return; }
                console.log('leave', oldState.channel.members.size);
                lobbyStores.get(oldState.channel.parentID).leave(oldState.member, oldState.channel);
                break;
            }
            case oldState.channelID && newState.channelID && oldState.channelID !== newState.channelID && (lobbyStores.has(oldState.channel.parentID) || lobbyStores.has(newState.channel.parentID)): {
                switch (true) {
                    case !lobbyStores.has(oldState.channel.parentID): {
                        console.log('join', newState.channel.members.size);
                        lobbyStores.get(newState.channel.parentID).join(newState.member, newState.channel);
                        break;
                    }
                    case !lobbyStores.has(newState.channel.parentID): {
                        console.log('leave', oldState.channel.members.size);
                        lobbyStores.get(oldState.channel.parentID).leave(oldState.member, oldState.channel);
                        break;
                    }
                    case oldState.channel.members.size === 0 ? newState.channel.members.size !== 1 : newState.channel.members.size === 1 : {
                        console.log('j/l internal');
                        const LS = lobbyStores.get(newState.channel.parentID);
                        await LS.leave(newState.member, oldState.channel);
                        await LS.join(newState.member, newState.channel);
                        break;
                    }
                    default: {
                        console.log('internal');
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
