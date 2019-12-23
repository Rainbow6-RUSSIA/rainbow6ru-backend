import { GuildBlacklist, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';
import { debug } from '../../..';

interface IBlockArgs {
    target: U;
}

export default class Block extends Command {
    constructor() {
        super('block', {
            aliases: ['block'],
            args: [{
                id: 'target',
                type: 'user',
            }],
            channel: 'guild',
            userPermissions: 'BAN_MEMBERS',
        });
        this.typing = true;
    }

    public exec = async (message: Message, args: IBlockArgs) => {
        const dbUser = await User.findByPk(args.target.id);
        if (!dbUser) { return message.reply('пользователь не зарегистрирован'); }
        const BLRecord = new GuildBlacklist({
            allowed: false,
            guildId: message.guild.id,
            userId: args.target.id,
        });
        await BLRecord.save();
        debug.log(`${message.author} внес <@${dbUser.id}> в черный список`);
        return message.reply('пользователь внесен в черный список');
    }
}
