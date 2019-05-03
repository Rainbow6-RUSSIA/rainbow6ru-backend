import { Guild, User } from '@r6ru/db';
// import { TryCatch } from '@r6ru/utils';
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
        await User.destroy({where: {
            id: target.id,
        }});
        const { guild } = message;
        const { platformRoles, rankRoles} = await Guild.findByPk(guild.id);
        const member = await guild.members.fetch(target.id);
        member.roles.remove([...Object.values(platformRoles), ...rankRoles].filter(Boolean), 'пользователь удален');

        return message.reply('пользователь удален');
    }
}
