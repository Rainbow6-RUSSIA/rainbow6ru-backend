import { Lobby, User } from '@r6ru/db';
// import { TryCatch } from '@r6ru/utils';
import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import { debug } from '../../..';

export default class MemberRemove extends Listener {
    public constructor() {
        super('memberRemove', {
            emitter: 'client',
            event: 'guildMemberRemove',
        });
    }

// @TryCatch(debug)
    public exec = async (member: GuildMember) => {
        const UInst = await User.findByPk(member.id, {include: [Lobby]});
        if (!UInst) { return; }

        if (UInst.lobby && UInst.lobby.guildId === member.guild.id) {
            UInst.set({
                lobby: null,
            });

            console.log('[BOT] Kicking from lobby', member.user.tag, member.id);
        }

        if (!this.client.guilds.array().some((g) => !g.available || g.members.has(member.id))) {

            UInst.set({
                inactive: true,
            });

            console.log('[BOT] Inactivating', member.user.tag, member.id);
        }

        await UInst.save();
    }
}
