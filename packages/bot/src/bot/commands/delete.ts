import { Guild, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, TextChannel, User as U } from 'discord.js';

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
    public async exec(message: Message, args: IDeleteArgs) {
        const { target } = args;
        await User.destroy({where: {
            id: target.id,
        }});
        const { guild } = message;
        try {
            const { platformRoles, rankRoles} = await Guild.findByPk(guild.id);
            const member = await guild.members.fetch(target.id);
            member.roles.remove([...Object.values(platformRoles), ...rankRoles].filter((r) => r), 'пользователь удален');
        } catch (err) {
            console.log(err);
        }
        return message.reply('пользователь удален');
    }
}
