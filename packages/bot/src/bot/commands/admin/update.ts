import { Guild as G, User as U } from '@r6ru/db';
import { UpdateStatus } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';
import { debug } from '../../..';
import Sync from '../../../utils/sync';

interface IUpdateArgs {
    user: User;
    verification: number;
}

export default class Update extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('update', {
            aliases: ['update', 'U'],
            args: [{
                id: 'user',
                type: 'user',
            }, {
                id: 'verification',
                type: 'number',
            }],
            channel: 'guild',
            userPermissions: 'MANAGE_ROLES',
        });
        this.typing = true;
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IUpdateArgs) => {
        const dbUser = await U.findByPk(args.user.id);
        if (args.verification === 3) {
            debug.log(`${message.author} верифицировал аккаунт <@${dbUser.id}> ${dbUser}`);
            try {
                if (await message.guild.members.fetch(args.user.id)) {
                    dbUser.inactive = false;
                }
            } catch (err) {
                console.log(err);
            }
        }
        dbUser.verificationLevel = args.verification || dbUser.verificationLevel;
        await dbUser.save();
        const status = await Sync.updateMember(await G.findByPk(message.guild.id), dbUser);
        switch (status) {
            case UpdateStatus.ALREADY_SENT: return message.reply('сообщение о верификации уже было отправлено ранее!');
            case UpdateStatus.DM_CLOSED: return message.reply('при запросе верификации произошла ошибка, скорее всего ЛС закрыто!');
            case UpdateStatus.GUILD_LEFT: return message.reply('пользователь покинул сервер!');
            case UpdateStatus.GUILD_NONPREMIUM: return message.reply('на этом сервере команда недоступна!');
            case UpdateStatus.VERIFICATION_SENT: return message.reply('новое сообщение о верификации было отправлено!');
            
            case UpdateStatus.SUCCESS:
            default: return message.reply('обновлено');
        }
        
    }
}
