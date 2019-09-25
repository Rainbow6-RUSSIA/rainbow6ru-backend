import { Guild, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';
import { debug } from '../../..';
import Sync from '../../../utils/sync';

interface IArgs {
    target: GuildMember;
}

export default class Nickname extends Command {
    public constructor() {
        super('nickname', {
            aliases: ['nickname', 'nick', 'N'],
            args: [{
                id: 'target',
                type: 'member',
            }],
            channel: 'guild',
            cooldown: 5 * 60 * 1000,
            ignoreCooldown: (msg: Message) => msg.member.hasPermission('MANAGE_ROLES'),
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        let { target } = args;
        if (!target) {
            target = message.member;
        }
        if (target.id !== message.author.id && !message.member.hasPermission('MANAGE_ROLES') && ![...this.client.ownerID].includes(message.author.id)) {
            await message.reply('изменение синхронизации ников других пользователей доступно только администрации!');
            target = message.member;
        }
        const dbUser = await User.findByPk(target.id);
        if (dbUser && dbUser.genome) {
            dbUser.syncNickname = !dbUser.syncNickname;
            await dbUser.save();
            if (dbUser.syncNickname) {
                await Sync.updateMember(await Guild.findByPk(message.guild.id), dbUser);
            } else {
                try {
                    await target.setNickname(null);
                } catch (err) {
                    console.log('Reset nickname failed', err);
                }
            }
            debug.log(`синхронизация ника <@${dbUser.id}> ${dbUser.syncNickname ? 'включена' : 'отключена'}!`);
            return message.reply(`синхронизация игрового ника ${dbUser.syncNickname ? 'включена' : 'отключена'}!`);
        } else {
            return message.reply(target.id !== message.author.id ? 'пользователь не зарегистрирован!' : 'вы должны сначала зарегистрироваться!');
        }

    }
}
