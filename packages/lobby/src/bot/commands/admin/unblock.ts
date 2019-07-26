import { GuildBlacklist, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';
import { debug } from '../../..';

interface IUnblockArgs {
    target: U;
}

export default class Unblock extends Command {
    constructor() {
        super('unblock', {
            aliases: ['unblock'],
            args: [{
                id: 'target',
                type: 'user',
            }],
            channel: 'guild',
            userPermissions: 'BAN_MEMBERS',
        });
    }

    public exec = async (message: Message, args: IUnblockArgs) => {
        const dbUser = await User.findByPk(args.target.id);
        if (!dbUser) { return message.reply('пользователь не зарегистрирован'); }
        const BLRecord = await GuildBlacklist.findOne({ where: {
            guildId: message.guild.id,
            userId: args.target.id,
        }});
        if (BLRecord) {
            BLRecord.allowed = true;
            await BLRecord.save();
            debug.log(`Пользователь <@${args.target.id}> отмечен ${message.author} как разбаненый!`);
            return message.reply(`пользователь <@${args.target.id}> отмечен ${message.author} как разбаненый!`);
        } else {
            return message.reply('пользователь не в черном списке!');
        }
    }
}
