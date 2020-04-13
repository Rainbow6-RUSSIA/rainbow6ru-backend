import { Listener } from 'discord-akairo';
import { GuildMember, VoiceState } from 'discord.js';
import VoiceStateUpdate from '../voiceStateUpdate';

export default class MemberRemove extends Listener {
    public constructor() {
        super('memberRemove', {
            emitter: 'client',
            event: 'guildMemberRemove',
        });
    }

    public exec = async (member: GuildMember) => {
        if (member.voice) {
            VoiceStateUpdate.handle(
                ({
                    ...member.voice,
                    member,
                    channel: member.guild.channels.get(member.voice.channelID),
                } as any) as VoiceState,
                ({ ...member.voice, member, channelID: null } as any) as VoiceState,
            );
        }
    };
}
