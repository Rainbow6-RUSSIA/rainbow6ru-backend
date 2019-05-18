import { Listener } from 'discord-akairo';
import { GuildMember, Presence } from 'discord.js';
import { LobbyStore, lobbyStores } from '../lobby';

export default class PresenceUpdate extends Listener {
    public constructor() {
        super('presenceUpdate', {
            emitter: 'client',
            event: 'presenceUpdate',
        });
    }

    public exec = async (_: Presence, newPresence: Presence) => {
        const member = newPresence.member as GuildMember;
        if (member.voice.channelID && lobbyStores.has(member.voice.channel.parentID)) {
            lobbyStores
                .get(member.voice.channel.parentID)
                .reportIngameStatus(member, LobbyStore.detectIngameStatus(newPresence));
        }
    }
}
