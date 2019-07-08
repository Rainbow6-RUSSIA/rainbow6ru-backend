import { Argument, Command } from 'discord-akairo';
import { GuildMember, Message, MessageReaction, User as U } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { $enum } from 'ts-enum-util';

import { Guild, User } from '@r6ru/db';
import r6 from '../../../r6api';

import { IUbiBound, ONLINE_TRACKER, PLATFORM, RANKS, REGIONS, UUID, VERIFICATION_LEVEL } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import { debug } from '../../..';
import embeds from '../../../utils/embeds';
import ENV from '../../../utils/env';
import Security from '../../../utils/security';
import Sync from '../../../utils/sync';
import ubiGenomeFromNickname from '../../types/ubiGenomeFromNickname';
// import ubiNickname from '../types/ubiNickname';

interface IRankArgs {
    genome: UUID;
    nickname: string;
    target: GuildMember;
    bound: IUbiBound[] | null | Error;
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

            if (bound instanceof Error) {
                throw bound;
            }
            const dbGuild = await Guild.findByPk(message.guild.id);
            const nonPremium = dbGuild.premium === false;
            const platformRoles = nonPremium ? null : dbGuild.platformRoles;

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

            let dbUser = await User.findByPk(target.id);

            const currentRoles = target.roles.keyArray();
            const platform = nonPremium ? { PC: true } : {
                PC: currentRoles.includes(platformRoles.PC),
                PS4: currentRoles.includes(platformRoles.PS4),
                XBOX: currentRoles.includes(platformRoles.XBOX),
            };
            const activePlatform = $enum(PLATFORM).getValues().find(p => platform[p]) || 'PC';
            const activeBound = bound.find(b => b.platform === activePlatform);

            if (!activeBound) {
                return message.reply(`выбранная платформа \`${activePlatform}\` не совпадает с платформой указанного аккаунта (${bound.map(b => '`' + b.platform + '`').join(', ')})`);
            }

            if (dbUser && dbUser.genome) {
                let msg: Message;
                if (adminAction) {
                    msg = (await message.reply(`пользователь уже зарегистрирован!\nДля смены привязанного аккаунта на указанный добавьте реакцию - ♻.`)) as Message;
                } else {
                    const time = (await User.count({where: {inactive: false}})) * parseInt(ENV.COOLDOWN) / parseInt(ENV.PACK_SIZE) + new Date(dbUser.rankUpdatedAt).valueOf() - Date.now();
                    msg = (await message.reply(`вы уже зарегистрированы, ${time > 5 * 60 * 1000 ? `обновление ранга будет через \`${
                        humanizeDuration(
                            time,
                            {conjunction: ' и ', language: 'ru', round: true},
                        )
                    }\`` : 'скоро будет обновление ранга' }.\n`
                    + (dbUser.requiredVerification > dbUser.verificationLevel ? '*В целях безопасности требуется подтверждение аккаунта Uplay. Следуйте инструкциям, отправленным в ЛС.*\n' : '')
                    + (dbUser.genome !== activeBound.genome ? `Для смены привязанного аккаунта на указанный (${ONLINE_TRACKER}${activeBound.genome}) добавьте реакцию - ♻.` : ''))) as Message;
                }
                if (dbUser.genome !== activeBound.genome) {
                    msg.react('♻');
                    const result = await msg.awaitReactions((reaction: MessageReaction, user: U) => reaction.emoji.name === '♻' && user.id === message.author.id, { time: 30000, max: 1 });
                    if (result.size) {
                        await msg.edit(msg.content + `\nОжидайте дальнейших инструкций в ЛС от <@${this.client.user.id}>`);
                        return Security.changeGenome(dbUser, dbGuild, activeBound.genome);
                    }
                } else {
                    return Sync.updateMember(dbGuild, dbUser);
                }
            }

            // if (!nonPremium && !adminAction && (activePlatform !== bound.platform)) {
            const rawRank = (await r6.api.getRank(activeBound.platform, activeBound.genome))[activeBound.genome];

            const regionRank = $enum(REGIONS).getValues().map(r => rawRank[r].rank);
            const mainRegion = $enum(REGIONS).getValues()[regionRank.indexOf(Math.max(...regionRank))];
            const stats = (await r6.api.getStats(activeBound.platform, activeBound.genome, {general: '*'}))[activeBound.genome];

            if (!(stats && stats.general)) {
                return message.reply(`указанный аккаунт не запускал Rainbow Six Siege (\`${activeBound.platform}\`)`);
            }
            // console.log('​Rank -> publicexec -> rawRank[mainRegion]', rawRank[mainRegion]);
            if (!nonPremium || adminAction) {
                platform[activeBound.platform] = true;
            }
            dbUser = new User({
                genome: activeBound.genome,
                id: target.id,
                inactive: false,
                nickname: activeBound.nickname,
                nicknameUpdatedAt: new Date(),
                platform,
                rank: rawRank[mainRegion].rank,
                rankUpdatedAt: new Date(),
                region: mainRegion,
                requiredVerification:
                (nonPremium || !platform.PC) ? VERIFICATION_LEVEL.NONE
                : ((Date.now() - target.user.createdTimestamp) < parseInt(ENV.REQUIRED_ACCOUNT_AGE) || rawRank[mainRegion].rank >= dbGuild.fixAfter || (await r6.api.getLevel(activeBound.platform, activeBound.genome))[activeBound.genome].level < parseInt(ENV.REQUIRED_LEVEL)) ? VERIFICATION_LEVEL.QR
                : dbGuild.requiredVerification,
                verificationLevel:
                (target.nickname || '').includes(activeBound.nickname) ||
                target.user.username.includes(activeBound.nickname) ? VERIFICATION_LEVEL.MATCHNICK
                : VERIFICATION_LEVEL.NONE,
            });

            const prompt = await combinedPrompt(
                await message.reply(`игрок с ником **${activeBound.nickname}** найден, это верный профиль?`, embeds.rank(activeBound, stats.general)) as Message,
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
                    await dbUser.save();
                    await debug.log(`<@${dbUser.id}> зарегистрировался как ${ONLINE_TRACKER}${dbUser.genome}`);
                    await Security.detectDupes(dbUser, dbGuild);
                    if (dbUser.requiredVerification >= VERIFICATION_LEVEL.QR) {
                        debug.log(`автоматически запрошена верификация аккаунта <@${dbUser.id}> ${ONLINE_TRACKER}${dbUser.genome}`);
                        setTimeout(() => Sync.updateMember(dbGuild, dbUser), 5000);
                        return message.reply(`вы успешно ${adminAction ? `зарегистрировали ${target}` : 'зарегистрировались'}! Ник: \`${dbUser.nickname}\`, ранг \`${RANKS[dbUser.rank]}\`\n*В целях безопасности требуется подтверждение аккаунта Uplay.${adminAction ? ' Инструкции высланы пользователю в ЛС.' : ' Следуйте инструкциям, отправленным в ЛС.'}*`);
                    } else {
                        Sync.updateMember(dbGuild, dbUser);
                        return message.reply(`вы успешно ${adminAction ? `зарегистрировали ${target}` : 'зарегистрировались'}! Ник: \`${dbUser.nickname}\`, ранг \`${RANKS[dbUser.rank]}\``);
                    }
                }
            }

        } catch (err) {
            switch (true) {
                case ['public-ubiservices.ubi.com', 'gateway was unable to forward the request', 'request timed out while forwarding to the backend'].some(s => err.message.includes(s)):
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
