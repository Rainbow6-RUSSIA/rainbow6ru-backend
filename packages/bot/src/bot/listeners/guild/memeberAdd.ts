import { Guild, User } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import { syncMember } from '../../../utils/utils';

export default class MemberAdd extends Listener {
    public constructor() {
        super('memberAdd', {
            emitter: 'client',
            event: 'guildMemberAdd',
        });
    }
    public async exec(member: GuildMember) {
            User.update({
                inactive: false,
            }, {
                silent: true,
                where: {
                    id: member.id,
                },
            });

            syncMember(await Guild.findByPk(member.guild.id), await User.findByPk(member.id), []);

            console.log('[BOT] Reactivating', member.user.tag, member.id);
    }
}
