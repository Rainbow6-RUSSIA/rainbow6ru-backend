import { combinedPrompt } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';
import { debug } from '../../..';

interface IArgs {
    reason: string;
    targets: User[];
}

export default class Massban extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('massban', {
            aliases: ['massban', 'BANNAHUY'],
            args: [{
                id: 'reason',
                type: 'string',
            }, {
                id: 'id',
                limit: 1000,
                multipleFlags: true,
                type: /^(?:<@!?)?(\d{17,21})>?$/,
                unordered: true,
            }],
            channel: 'guild',
            userPermissions: 'BAN_MEMBERS',
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        console.log(args);
        const { reason, targets } = args;
        const prmt = await combinedPrompt(await message.reply(`будут забанены \`${targets.length}\` пользователей по причине \`${reason}\`. Продолжить?`) as Message, {
            author: message.author,
            emojis: ['✅', '❎'],
            texts: [['yes', 'да', '+'], ['no', 'нет', '-']],
        });
        if (prmt === 0) {
            await Promise.all(targets.map(t => message.guild.members.ban(t.id, { days: 7, reason})));
            return message.reply('готово!');
        }
    }
}
