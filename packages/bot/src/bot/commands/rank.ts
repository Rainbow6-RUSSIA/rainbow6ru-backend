import { Argument, Command } from 'discord-akairo';
import { GuildMember, Message, TextChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { $enum } from 'ts-enum-util';

import { Guild, User } from '@r6ru/db';
import r6 from '../../r6api';

import { IUbiBound, PLATFORM, RANKS, REGIONS, UUID, VERIFICATION_LEVEL } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import { debug } from '../..';
import embeds from '../../utils/embeds';
import ENV from '../../utils/env';
import { syncMember } from '../../utils/sync';
import ubiGenomeFromNickname from '../types/ubiGenomeFromNickname';
// import ubiNickname from '../types/ubiNickname';

interface IRankArgs {
    genome: UUID;
    nickname: string;
    target: GuildMember;
    bound: IUbiBound;
}

export default class Rank extends Command {
    public constructor() {
        super('rank', {
            aliases: ['rank', 'rang', 'R'],
            args: [{
                id: 'bound',
                prompt: {
                    ended: 'Слишком много попыток. Проверьте правильность и начните регистрацию сначала.',
                    retries: 0,
                    retry: 'Некорректный ник Uplay! Проверьте правильность и попробуйте еще раз.',
                    start: 'Введите корректный ник в Uplay!',
                    time: 30000,
                    timeout: 'Время вышло. Начните регистрацию сначала.',
                },
                type: ubiGenomeFromNickname,
                unordered: true,
            }, {
                id: 'target',
                type: 'member',
                unordered: true,
            }],
            channel: 'guild',
            cooldown: 10000,
            ratelimit: 1,
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IRankArgs) => {
        console.log('[Log] rank called');
        try {
            const { bound } = args;
            let { target } = args;
            // console.log(bound, target);
            const { member } = message;

            if (bound && bound.err) {
                throw bound.err;
            }
            const GInst = await Guild.findByPk(message.guild.id);
            const nonPremium = GInst.premium === false;
            const platformRoles = nonPremium ? null : GInst.platformRoles;

            let adminAction: boolean = null;

            // console.log(target, member);

            if (target && member.id !== target.id && (member.hasPermission('MANAGE_ROLES') || [...this.client.ownerID].includes(member.id))) {
                console.log('switch admin mode');
                adminAction = true;
            } else if (target && member.id !== target.id) {
                return message.reply('регистрация других пользователей доступна **только администрации**');
            } else {
                adminAction = false;
                target = member;
            }

            let UInst = await User.findByPk(target.id);

            if (UInst && UInst.genome) {
                if (adminAction) {
                    return message.reply(`пользователь уже зарегистрирован!`);
                } else {
                    syncMember(GInst, UInst);
                    return message.reply(`вы уже зарегистрированы, обновление ранга будет через \`${
                        humanizeDuration(
                            (await User.count({where: {inactive: false}})) * parseInt(ENV.COOLDOWN) / parseInt(ENV.PACK_SIZE) + new Date(UInst.rankUpdatedAt).valueOf() - Date.now(),
                            {conjunction: ' и ', language: 'ru', round: true},
                        )
                    }\``);
                }
            }

            const currentRoles = target.roles.keyArray();
            const platform = nonPremium ? null : {
                PC: currentRoles.includes(platformRoles.PC),
                PS4: currentRoles.includes(platformRoles.PS4),
                XBOX: currentRoles.includes(platformRoles.XBOX),
            };
            const activePlatform = nonPremium ? null : $enum(PLATFORM).getValues().find((p) => platform[p]);
            if (!nonPremium && !adminAction && (activePlatform !== bound.platform)) {
                    return message.reply('выбранная вами платформа не совпадает с платформой указанного аккаунта!');
            }
            const rawRank = (await r6.api.getRank(bound.platform, bound.genome))[bound.genome];

            // console.log('​Rank -> publicexec -> rawRank', rawRank);
            const regionRank = $enum(REGIONS).getValues().map((r) => rawRank[r].rank);
            // console.log('​Rank -> publicexec -> regionRank', regionRank);
            const mainRegion = $enum(REGIONS).getValues()[regionRank.indexOf(Math.max(...regionRank))];
            // console.log('TCL: Rank -> publicexec -> $enum(REGIONS).getValues()', $enum(REGIONS).getValues());
            // console.log('TCL: Rank -> publicexec -> REGIONS', REGIONS);
            // console.log('​Rank -> publicexec -> mainRegion', mainRegion);
            const stats = (await r6.api.getStats(bound.platform, bound.genome, {general: '*'}))[bound.genome];

            if (!(stats && stats.general)) {
                return message.reply('указанный аккаунт не имеет Rainbow Six Siege');
            }
            // console.log('​Rank -> publicexec -> rawRank[mainRegion]', rawRank[mainRegion]);
            if (!nonPremium) {
                platform[bound.platform] = true;
            }
            UInst = new User({
                genome: bound.genome,
                id: target.id,
                inactive: false,
                nickname: bound.nickname,
                nicknameUpdatedAt: new Date(),
                platform,
                rank: rawRank[mainRegion].rank,
                rankUpdatedAt: new Date(),
                region: mainRegion,
                requiredVerification:
                nonPremium ? VERIFICATION_LEVEL.NONE
                : ((Date.now() - target.user.createdTimestamp) < parseInt(ENV.REQUIRED_ACCOUNT_AGE) || rawRank[mainRegion].rank >= GInst.fixAfter || (await r6.api.getLevel(bound.platform, bound.genome))[bound.genome].level < parseInt(ENV.REQUIRED_LEVEL)) ? VERIFICATION_LEVEL.QR
                : GInst.requiredVerification,
                verificationLevel:
                (target.nickname || '').includes(bound.nickname) ||
                target.user.username.includes(bound.nickname) ? VERIFICATION_LEVEL.MATCHNICK
                : VERIFICATION_LEVEL.NONE,
            });

            const prompt = await combinedPrompt(
                await message.reply(`игрок с ником **${bound.nickname}** найден, это верный профиль?`, { embed: embeds.rank(bound, stats.general) }) as Message,
                {
                    author: message.author,
                    emojis: ['✅', '❎'],
                    texts: [['yes', 'да', '+'], ['no', 'нет', '-']],
                },
            );

            switch (prompt) {
                case 1: return message.reply('вы отклонили регистрацию. Попробуйте снова, указав нужный аккаунт.');
                case -1: return message.reply('время на подтверждение истекло. Попробуйте еще раз и нажмите реакцию для подтверждения.');
                case 0: {
                    await UInst.save();
                    setTimeout(() => syncMember(GInst, UInst), UInst.requiredVerification >= VERIFICATION_LEVEL.QR ? 5000 : 0);
                    return message.reply(`вы успешно ${adminAction ? `зарегистрировали <@${target.id}>` : 'зарегистрировались'}! Ник: \`${UInst.nickname}\`, ранг \`${RANKS[UInst.rank]}\`${UInst.requiredVerification >= VERIFICATION_LEVEL.QR ? `\n*В целях безопасности требуется подтверждение аккаунта Uplay.${adminAction ? ' Инструкции высланы пользователю в ЛС.' : ' Следуйте инструкциям, отправленным в ЛС.'}*` : ''}`);
                }
            }

        } catch (err) {
            switch (true) {
                case err.message.includes('The gateway was unable to forward the request to the backend service.'):
                    debug.error(err, 'UBI');
                    return message.reply('сервера Ubisoft недоступны, попробуйте позднее.');
                default:
                    break;
            }
            const code = Math.random().toString(36).substring(2, 6);
            message.reply(`произошла ошибка! Код: \`${code}\` (данные для поддержки)`);
            err.message = `CODE: ${code}, ${err.message}`;
            throw err;
        }
    }
}
