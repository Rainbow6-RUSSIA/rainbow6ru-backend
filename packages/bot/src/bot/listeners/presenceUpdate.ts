import { IngameStatus, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { Activity, Guild, GuildMember, Presence } from 'discord.js';
import { LobbyStore, lobbyStores } from '../../utils/lobby';

export default class PresenceUpdate extends Listener {
    public constructor() {
        super('presenceUpdate', {
            emitter: 'client',
            event: 'presenceUpdate',
        });
    }
    public async exec(oldPresence: Presence, newPresence: any) {
        const member = newPresence.member as GuildMember;
        if (member.voice.channelID && lobbyStores.has(member.voice.channel.parentID)) {
            lobbyStores
                .get(member.voice.channel.parentID)
                .reportIngameStatus(member, LobbyStore.detectIngameStatus(newPresence));
        }
    }
}
