import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';
import { combinedPrompt } from '../../../../utils/build';

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
                id: 'targets',
                prompt: {
                    infinite: true,
                    start: 'Кого забанить нахуй?. Упоминайте по одному участнику в сообщении. Введите \`stop\` для остановки.',
                    time: 60 * 1000,
                },
                type: 'user',
            }],
            channel: 'guild',
            userPermissions: 'BAN_MEMBERS',
        });
    }
    public async exec(message: Message, args: IArgs) {
        const { reason, targets } = args;
        const prmt = await combinedPrompt(await message.reply(`будут забанены \`${targets.length}\` пользователей по причине \`${reason}\`. Продолжить?`) as Message, {
            author: message.author,
            emojis: ['✅', '❎'],
            texts: [['yes', 'да', '+'], ['no', 'нет', '-']],
        });
        if (prmt === 0) {
            await Promise.all(targets.map((t) => message.guild.members.ban(t.id, { days: 7, reason})));
            return message.reply('готово!');
        }
    }
}
