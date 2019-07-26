import { Guild, User } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import ENV from '../../../utils/env';
import Sync from '../../../utils/sync';

export default class MemberAdd extends Listener {
    public constructor() {
        super('memberAdd', {
            emitter: 'client',
            event: 'guildMemberAdd',
        });
    }

    public exec = async (member: GuildMember) => {
        if (ENV.NODE_ENV !== 'development' && ENV.LOBBY_MODE !== 'only') {
            const updated = await User.update({
                inactive: false,
            }, {
                silent: true,
                where: {
                    id: member.id,
                },
            });
            if (!updated[0]) { return; }
            await Sync.updateMember(await Guild.findByPk(member.guild.id), await User.findByPk(member.id));
            console.log('[BOT] Reactivating', member.user.tag, member.id);
        }
    }
}
