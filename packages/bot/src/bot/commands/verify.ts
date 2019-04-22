import { Guild, User } from '@r6ru/db';
import { VERIFICATION_LEVEL } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';
import ENV from '../../utils/env';
import { verify } from '../../utils/qr';
import { syncMember } from '../../utils/sync';

interface IArgs {
    target: U;
}

export default class Verify extends Command {
    public constructor() {
        super('verify', {
            aliases: ['verify', 'V'],
            args: [{
                default: (msg: Message) => msg.author,
                id: 'target',
                type: 'user',
            }],
            cooldown: 5000,
        });
    }
    public async exec(message: Message, args: IArgs) {
        const { target } = args;
        if (target.id !== message.author.id && (!(message.member.hasPermission('MANAGE_ROLES')) || ![...this.client.ownerID].includes(message.author.id))) {
            message.reply('верификация других пользователей доступна только администрации!');
        } else {
            return message.channel.type === 'text'
                ? this.verifyMember(message, await User.findByPk(target.id))
                : message.reply('верификация других пользователей возможна только на серверах!');
        }
        const UInst = await User.findByPk(message.author.id);
        if (UInst && UInst.genome) {
            if (UInst.verificationLevel >= VERIFICATION_LEVEL.QR) {
                return message.reply('вы уже подтвердили свой аккаунт!');
            }
            if (message.channel.type === 'dm') {
                return this.verifyDM(message, UInst);
            } else {
                return this.verifyGuild(message, UInst);
            }
        } else {
            return message.reply('вы должны сначала зарегистрироваться!');
        }
    }

    private async verifyMember(message: Message, UInst: User) {
        UInst.requiredVerification = VERIFICATION_LEVEL.QR;
        await UInst.save();
        await syncMember(await Guild.findByPk(message.guild.id), UInst);
    }

    private async verifyDM(message: Message, UInst: User) {
        try {
            if (await verify(UInst.genome, message.author.id)) {
                UInst.verificationLevel = VERIFICATION_LEVEL.QR;
                UInst.inactive = false;
                await UInst.save();
                const msg = await message.reply(`Вы успешно подтвердили свой аккаунт ${ENV.VERIFIED_BADGE}! Возвращаем роли...`) as Message;
                const guilds = await Guild.findAll({where: {premium: true}});
                await Promise.all(guilds.map((g) => this.client.guilds.get(g.id).members.fetch()));
                await Promise.all(guilds.filter((g) => this.client.guilds.get(g.id).members.has(UInst.id)).map((g) => syncMember(g, UInst)));
                return msg.edit(`Вы успешно подтвердили свой аккаунт ${ENV.VERIFIED_BADGE}! Роли возвращены, приятной игры!`);
            } else {
                return message.reply('Неккоректный QR-код!');
            }
        } catch (err) {
            console.log(err);
            return message.reply('QR-код не установлен!');
        }
    }

    private async verifyGuild(message: Message, UInst: User) {
        const prmpt = await combinedPrompt(await message.reply('вы действительно хотите пройти процедуру верификации с помощью QR-кода?\nВам потребуется доступ к панели управления аккаунтом Uplay и немного желания 😀.\nУбедитесь, что не заблокировали ЛС с ботом.') as Message, {
            author: message.author,
            emojis: ['✅', '❎'],
            texts: [['да', 'yes', '+'], ['нет', 'no', '-']],
            time: 15 * 60 * 1000,
        });
        switch (prmpt) {
            case 1: return message.reply('вы отклонили подтверждение.');
            case -1: return message.reply('время на подтверждение истекло.');
            case 0: {
                UInst.requiredVerification = 3;
                await UInst.save();
                await syncMember(await Guild.findByPk(message.guild.id), UInst);
                return message.reply('инструкции отправлены вам в ЛС.');
            }
        }

    }
}
