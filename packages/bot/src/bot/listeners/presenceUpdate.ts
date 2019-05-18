import { IngameStatus, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { Activity, Guild, GuildMember, Presence } from 'discord.js';
import { debug } from '../..';
import { LobbyStore, lobbyStores } from '../lobby';

export default class PresenceUpdate extends Listener {
    public constructor() {
        super('presenceUpdate', {
            emitter: 'client',
            event: 'presenceUpdate',
        });
    }

    public exec = async (oldPresence: Presence, newPresence: any) => {
        const member = newPresence.member as GuildMember;
        if (member.voice.channelID && lobbyStores.has(member.voice.channel.parentID)) {
            lobbyStores
                .get(member.voice.channel.parentID)
                .reportIngameStatus(member, LobbyStore.detectIngameStatus(newPresence));
        }
    }
}
