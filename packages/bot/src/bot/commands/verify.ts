import { User } from '@r6ru/db';
import { VERIFICATION_LEVEL } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { generate, verify } from '../../utils/qr';

export default class Help extends Command {
    public constructor() {
        super('verify', {
            aliases: ['verify', 'V'],
            channel: 'dm',
            cooldown: 5000,
        });
    }
    public async exec(message: Message) {
        const UInst = await User.findByPk(message.author.id);
        if (UInst && UInst.genome) {
            try {
                if (await verify(UInst.genome, message.author.id)) {
                    UInst.verificationLevel = VERIFICATION_LEVEL.QR;
                    UInst.inactive = false;
                    UInst.save();
                    return message.reply('Вы успешно подтвердили свой аккаунт!');
                } else {
                    return message.reply('Неккоректный QR-код!');
                }
            } catch (err) {
                return message.reply('QR-код не установлен!');
            }
        } else {
            return message.reply('Вы должны сначала зарегистрироваться!');
        }
    }
}
