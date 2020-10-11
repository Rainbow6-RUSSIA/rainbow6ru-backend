import { Guild, User } from '@r6ru/db';
import { HF_REGIONS, IUbiBound, ONLINE_TRACKER, PLATFORM, REGIONS, UpdateStatus } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import { ArgumentOptions, Command, Flag } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { debug } from '../../..';
import Security from '../../../utils/security';
import ubiGenomeFromNickname, { IUbiBoundType } from '../../types/ubiGenomeFromNickname';

interface IAccountArgs {
    target?: GuildMember;
    bound?: IUbiBoundType;
    isAdmin?: boolean;
    dbUser?: User;
    region?: REGIONS;
    error?: Error;
}

export default class Account extends Command {
    public constructor() {
        super('account', {
            aliases: ['acc', 'account'],
            channel: 'guild',
            ratelimit: 5000,
        });
        this.typing = true;
    }

    public async *args(message: Message): AsyncGenerator<ArgumentOptions, IAccountArgs, any> {
        const { member } = message;
        let isAdmin = member.hasPermission('MANAGE_ROLES') || [...this.client.ownerID].includes(member.id);
        const target: GuildMember = isAdmin
            ? yield { type: 'member', unordered: true, default: member }
            : member;
        isAdmin = isAdmin && target.id !== member.id;

        const dbUser = await User.findByPk(target.id);

        if (!dbUser) {
            return null;
        }

        const region: REGIONS = yield {
            type: $enum(REGIONS).getValues(),
            unordered: true
        };

        let bound: IUbiBoundType = yield {
            type: ubiGenomeFromNickname,
            unordered: true,
        };

        if (bound instanceof Error) {
            return { error: bound };
        }

        if (bound && bound[0].genome === dbUser.genome) {
            bound = null;
        }

        return { isAdmin, bound, target, region, dbUser };

    }

    public async exec(message: Message, args: IAccountArgs) {
        if (!args) { return message.reply('вы должны сначала зарегистрироваться!'); }
        try {
            const { dbUser, bound, error, region } = args;
            if (error) { throw error; }
            const changeRegion = region && region !== dbUser.region;
            const changeAccount = Boolean(bound);
            if (changeRegion) {
                await message.reply(`регион сбора статистики изменен с \`${HF_REGIONS[dbUser.region]}\` на \`${HF_REGIONS[region]}\`!`);
                dbUser.region = region;
                dbUser.rankUpdatedAt = new Date('2000');
                await dbUser.save();
            }
            if (changeAccount) {
                this.typing = false;
                const prmpt = await combinedPrompt(
                    await message.reply(`вы действительно хотите сменить текущий привязанный аккаунт ${dbUser} на ${ONLINE_TRACKER}${bound[0].genome}?\nВам потребуется подтвердить факт владения аккаунтом.`),
                    {
                        author: message.author,
                        emojis: ['✅', '❎'],
                        texts: [['да', 'yes', '+'], ['нет', 'no', '-']],
                        time: 10 * 60 * 1000,
                    }
                );
                this.typing = true;
                switch (prmpt) {
                    case -1: return message.reply('время на подтверждение истекло.');
                    case 0: {
                        const result = await Security.changeGenome(dbUser, await Guild.findByPk(message.guild.id), bound[0].genome);
                        switch (result) {
                            case UpdateStatus.DM_CLOSED:
                                return message.reply('откройте ЛС и используйте команду `$rank`.');
                            case UpdateStatus.VERIFICATION_SENT:
                                return message.reply('следуйте инструкциям, отправленным в ЛС.');
                            case UpdateStatus.ALREADY_SENT:
                                return message.reply(`следуйте инструкциям, отправленным в ЛС с ${this.client.user} ранее.`);
                        }
                    }
                    case 1: return message.reply('вы отклонили смену привязанного аккаунта.');
                }
            }
            if (!changeAccount && !changeRegion) {
                return message.reply('ваш профиль не нуждается в обновлении с указанными аргументами! Проверьте правильность и попробуйте снова.');
            }
        } catch (error) {
            switch (true) {
                case ['public-ubiservices.ubi.com',
                    'too many requests',
                    'gateway was unable to forward the request',
                    'request timed out while forwarding to the backend'
                ].some(s => error.message.includes(s)):
                    debug.error(error, 'UBI');
                    message.reply('сервера Ubisoft недоступны, попробуйте позднее.');
                    break;
                default:
                    debug.error(error, 'BOT');
                    message.reply(`произошла ошибка! Попробуйте еще раз.`);
                    break;
                }
        }
    }
}
