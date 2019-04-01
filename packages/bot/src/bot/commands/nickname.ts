import { Guild, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message} from 'discord.js';
import { syncMember } from '../../utils/sync';

export default class Nickname extends Command {
    public constructor() {
        super('nickname', {
            aliases: ['nickname', 'nick', 'N'],
            cooldown: 5000,
        });
    }

    public async exec(message: Message) {
        const UInst = await User.findByPk(message.author.id);
        if (UInst && UInst.genome) {
            UInst.syncNickname = !UInst.syncNickname;
            await UInst.save();
            await syncMember(await Guild.findByPk(message.guild.id), UInst);
            return message.reply(`синхронизация игрового ника ${UInst.syncNickname ? 'включена' : 'отключена'}!`);
        } else {
            return message.reply('вы должны сначала зарегистрироваться!');
        }

    }
}
