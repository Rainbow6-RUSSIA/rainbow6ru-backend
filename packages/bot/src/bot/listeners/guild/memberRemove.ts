import { Lobby, User } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import { debug } from '../../..';
import { lobbyStores } from '../../lobby';

export default class MemberRemove extends Listener {
    public constructor() {
        super('memberRemove', {
            emitter: 'client',
            event: 'guildMemberRemove',
        });
    }

    public exec = async (member: GuildMember) => {
        const dbUser = await User.findByPk(member.id, {include: [Lobby]});
        if (!dbUser) { return; }
        if (!this.client.guilds.array().some((g) => !g.available || g.members.has(member.id))) {

            dbUser.set({
                inactive: true,
            });

            console.log('[BOT] Inactivating', member.user.tag, member.id);
        }

        await dbUser.save();
    }
}
