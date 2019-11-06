import { combinedPrompt } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';
import { debug } from '../../..';

interface IArgs {
    reason: string;
    targets: string;
}

export default class Massban extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('massban', {
            aliases: ['massban', 'BANNAHUY'],
            args: [{
                id: 'reason',
                type: 'string',
            }, {
                id: 'targets',
                type: 'string',
                match: 'restContent',
                default: ''
            }],
            channel: 'guild',
            userPermissions: 'BAN_MEMBERS',
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        console.log(args);
        const { reason, targets } = args;
        const ids = targets.match(/\d*/g).filter(i => i.length >= 17 && i.length <= 19);
        if (!ids.length) {
            return message.reply('пользователи не найдены!');
        }
        const prmt = await combinedPrompt(await message.reply(`будут забанены \`${ids.length}\` пользователей по причине \`${reason}\`. Продолжить?`) as Message, {
            author: message.author,
            emojis: ['✅', '❎'],
            texts: [['yes', 'да', '+'], ['no', 'нет', '-']],
        });
        if (prmt === 0) {
            await Promise.all(ids.map(t => message.guild.members.ban(t, { days: 7, reason})));
            return message.reply('готово!');
        }
    }
}
