import { Guild, User } from '@r6ru/db';
import { ONLINE_TRACKER } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message, TextChannel, User as U } from 'discord.js';
import { debug } from '../..';

interface IDeleteArgs {
    target: U;
}

export default class Delete extends Command {
    public constructor() {
        super('delete', {
            aliases: ['delete'],
            args: [{
                id: 'target',
                type: 'user',
            }],
            channel: 'guild',
            userPermissions: 'MANAGE_ROLES',
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IDeleteArgs) => {
        const { target } = args;
        const UInst = await User.findByPk(target.id);
        if (!UInst) {
            return message.reply('пользователь не найден');
        }
        debug.log(`аккаунт удален <@${UInst.id}> ${ONLINE_TRACKER}${UInst.genome}`);
        await UInst.destroy();
        const { guild } = message;
        const { platformRoles, rankRoles} = await Guild.findByPk(guild.id);
        const member = await guild.members.fetch(target.id);
        member.roles.remove([...Object.values(platformRoles), ...rankRoles].filter(Boolean), 'пользователь удален');

        return message.reply('пользователь удален');
    }
}
