import { Guild, User } from '@r6ru/db';
import { TryCatch } from '@r6ru/utils';
import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import { debug } from '../../..';
import { syncMember } from '../../../utils/sync';

export default class MemberAdd extends Listener {
    public constructor() {
        super('memberAdd', {
            emitter: 'client',
            event: 'guildMemberAdd',
        });
    }

    @TryCatch(debug)
    public exec = async (member: GuildMember) => {
            // чек на регистрацию
            User.update({
                inactive: false,
            }, {
                silent: true,
                where: {
                    id: member.id,
                },
            });

            syncMember(await Guild.findByPk(member.guild.id), await User.findByPk(member.id));

            console.log('[BOT] Reactivating', member.user.tag, member.id);
    }
}
