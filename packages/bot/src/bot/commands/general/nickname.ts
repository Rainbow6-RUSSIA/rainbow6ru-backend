import { Guild, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';
import { debug } from '../../..';
import Sync from '../../../utils/sync';

interface IArgs {
    target: U;
}

export default class Nickname extends Command {
    public constructor() {
        super('nickname', {
            aliases: ['nickname', 'nick', 'N'],
            args: [{
                id: 'target',
                type: 'user',
            }],
            channel: 'guild',
            cooldown: 5000,
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        let { target } = args;
        if (!target) {
            target = message.author;
        }
        if (target.id !== message.author.id && !message.member.hasPermission('MANAGE_ROLES') && ![...this.client.ownerID].includes(message.author.id)) {
            await message.reply('изменение синхронизации ников других пользователей доступно только администрации!');
            target = message.author;
        }
        const dbUser = await User.findByPk(target.id);
        if (dbUser && dbUser.genome) {
            dbUser.syncNickname = !dbUser.syncNickname;
            await dbUser.save();
            await Sync.updateMember(await Guild.findByPk(message.guild.id), dbUser);
            if (!dbUser.syncNickname) {
                try {
                    await (await message.guild.members.fetch(target.id)).setNickname(null);
                } catch (err) {
                    console.log(err);
                }
            }
            debug.log(`синхронизация ника <@${dbUser.id}> ${dbUser.syncNickname ? 'включена' : 'отключена'}!`);
            return message.reply(`синхронизация игрового ника ${dbUser.syncNickname ? 'включена' : 'отключена'}!`);
        } else {
            return message.reply(target.id !== message.author.id ? 'пользователь не зарегистрирован!' : 'вы должны сначала зарегистрироваться!');
        }

    }
}
