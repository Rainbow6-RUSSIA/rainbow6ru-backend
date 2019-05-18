import { Guild, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';
import { debug } from '../..';
import { syncMember } from '../../utils/sync';

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
            cooldown: 5000,
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        let { target } = args;
        if (!target) {
            target = message.author;
        }
        if (target.id !== message.author.id && ((message.channel.type !== 'text' && !(message.member.hasPermission('MANAGE_ROLES'))) || ![...this.client.ownerID].includes(message.author.id))) {
            message.reply('изменение синхронизации ников других пользователей доступно только администрации!');
            target = message.author;
        }
        const UInst = await User.findByPk(target.id);
        if (UInst && UInst.genome) {
            UInst.syncNickname = !UInst.syncNickname;
            await UInst.save();
            await syncMember(await Guild.findByPk(message.guild.id), UInst);
            return message.reply(`синхронизация игрового ника ${UInst.syncNickname ? 'включена' : 'отключена'}!`);
        } else {
            return message.reply(target.id !== message.author.id ? 'пользователь не зарегистрирован!' : 'вы должны сначала зарегистрироваться!');
        }

    }
}
