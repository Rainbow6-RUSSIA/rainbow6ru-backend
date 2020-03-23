import { ArgumentOptions, Command, Flag } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { $enum } from 'ts-enum-util';

import { Guild, User } from '@r6ru/db';
import r6 from '../../../utils/r6api';

import { HF_PLATFORM, HF_REGIONS, IUbiBound, PLATFORM, RANKS, REGIONS, UpdateStatus, VERIFICATION_LEVEL } from '@r6ru/types';
import { combinedPrompt, emojiNumbers } from '@r6ru/utils';
import { debug } from '../../..';
import embeds from '../../../utils/embeds';
import ENV from '../../../utils/env';
import Security from '../../../utils/security';
import Sync from '../../../utils/sync';
import ubiGenomeFromNickname, { IUbiBoundType } from '../../types/ubiGenomeFromNickname';
import { TextChannel } from 'discord.js';

interface IRankArgs {
    target?: GuildMember;
    bound?: IUbiBound[];
    isAdmin?: boolean;
    dbUser?: User;
    error?: Error;
}

export default class Rank extends Command {
    public constructor() {
        super('rank', {
            aliases: ['rank', 'rang', 'unranked', 'copper', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
            channel: 'guild',
            ratelimit: 100,
        });
    }

    public async *args(message: Message): AsyncGenerator<ArgumentOptions | Flag, IRankArgs, any> {
        const { member } = message;
        let isAdmin = member.hasPermission('MANAGE_ROLES') || [...this.client.ownerID].includes(member.id);
        const target: GuildMember = isAdmin
            ? yield { type: 'member', unordered: true, default: member }
            : member;
        isAdmin = isAdmin && target.id !== member.id;

        const dbUser = await User.findByPk(target.id);

        if (dbUser?.genome) {
            return { isAdmin, dbUser, target };
        }

        const bound: IUbiBoundType = yield {
            type: ubiGenomeFromNickname,
            unordered: true,
            prompt: {
                ended: `${member}, cлишком много попыток. Проверьте правильность и начните регистрацию сначала.`,
                retries: 2,
                retry: `${member}, неверный ник! Проверьте правильность и попробуйте еще раз.`,
                start: `${member}, введите корректный ник в Rainbow Six Siege!`,
                time: 120000,
                timeout: `${member}, время вышло. Начните регистрацию сначала.`,
            },
        };

        if (bound instanceof Error) {
            return { error: bound };
        }

        return { isAdmin, bound, target };

    }

    public async exec(message: Message, args: IRankArgs) {
        if (args === null) { return; }

        const { channel } = message;
        const { dbUser, isAdmin, error } = args;

        try {
            if (error) { throw error; }

            this.typing = true;
            if (dbUser) {
                await this.execRegistered(message, args);
            } else {
                await this.execNew(message, args);
            }

        } catch (error) {
            switch (true) {
                case ['public-ubiservices.ubi.com',
                    'too many requests',
                    'gateway was unable to forward the request',
                    'request timed out while forwarding to the backend',
                    'RendezVous'
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

        this.typing = false;

        if (message.channel instanceof TextChannel && message.channel.name.includes('registration')) {
            setTimeout(() => {
                channel.bulkDelete(
                    channel.messages
                    .filter(m => !m.deleted)
                    .filter(m =>
                        m.mentions.has(message.author)
                        || (m.author.id === message.author.id && !isAdmin)
                    )
                );
            }, 5 * 60 * 1000);
        }
    }

    public async execNew(message: Message, args: IRankArgs) {

        const { bound, target, isAdmin } = args;

        const dbGuild = await Guild.findByPk(message.guild.id);
        const nonPremium = dbGuild.premium === false;

        let mainPlatform: PLATFORM = null;

        if (bound.length > 1) {
            this.typing = false;
            const res = await combinedPrompt(
                await message.reply('поиск обнаружил несколько аккаунтов на разных платформах, выберите основную:\n' + bound.map((b, i) => `${i + 1}. \`${HF_PLATFORM[b.platform]}\``).join('\n')),
                {
                    author: message.author,
                    emojis: emojiNumbers(bound.length),
                    texts: bound.map(b => b.platform)
                }
            );
            if (res === -1) { return message.reply('время на подтверждение истекло. Попробуйте еще раз и нажмите реакцию для подтверждения.'); }
            mainPlatform = bound[res].platform;
            this.typing = true;
        } else {
            mainPlatform = bound[0].platform;
        }

        const activeBound = bound.find(b => b.platform === mainPlatform);
        const stats = (await r6.api.getStats(mainPlatform, activeBound.genome, {general: '*'}))[activeBound.genome];

        if (!stats?.general) {
            return message.reply(`указанный аккаунт на платформе \`${mainPlatform}\` не запускал Rainbow Six Siege`);
        } else {
        this.typing = false;
        const res = await combinedPrompt(
                await message.reply(`это верный профиль?`, embeds.rank(activeBound, stats.general)),
            {
                author: message.author,
                emojis: ['✅', '❎'],
                texts: [['yes', 'да', '+'], ['no', 'нет', '-']],
            },
        );
        switch (res) {
            case 1: return message.reply('вы отклонили регистрацию. Попробуйте снова, указав нужный аккаунт.');
            case -1: return message.reply('время на подтверждение истекло. Попробуйте еще раз и нажмите реакцию для подтверждения.');
        }
        this.typing = true;
        }

        const rawRank = (await r6.api.getRank(mainPlatform, activeBound.genome))[activeBound.genome];
        const regions = $enum(REGIONS).getValues();
        const regionRank = regions.map(r => rawRank[r].rank);

        let mainRegion: REGIONS = null;

        if (regionRank.filter(Boolean).length !== 1) {
            this.typing = false;
            const res = await combinedPrompt(
                await message.reply(`выберите регион для сбора статистики:\n${regions.map((r, i) => `${i + 1}. \`${HF_REGIONS[r]}\` - \`${RANKS[rawRank[r].rank]}\``).join('\n')}`),
                {
                    author: message.author,
                    emojis: emojiNumbers(regions.length),
                    texts: regions,
                }
            );
            mainRegion = res === -1 ? REGIONS.A_EMEA : regions[res];
            this.typing = true;
        } else {
            mainRegion = regions[regionRank.indexOf(regionRank.filter(Boolean)[0])];
        }

        console.log(mainPlatform, mainRegion);

        const newUser = new User({
            genome: activeBound.genome,
            id: target.id,
            inactive: false,
            nickname: activeBound.nickname,
            nicknameUpdatedAt: new Date(),
            platform: {
                [mainPlatform]: true,
            },
            rank: rawRank[mainRegion].rank,
            rankUpdatedAt: new Date(),
            region: mainRegion,
            requiredVerification:
                (nonPremium || mainPlatform !== PLATFORM.PC)
                ? VERIFICATION_LEVEL.NONE
                    : (
                        (Date.now() - target.user.createdTimestamp) < parseInt(ENV.REQUIRED_ACCOUNT_AGE)
                        || rawRank[mainRegion].rank >= dbGuild.fixAfter
                        || (await r6.api.getLevel(mainPlatform, activeBound.genome))[activeBound.genome].level < parseInt(ENV.REQUIRED_LEVEL)
                    )
                ? VERIFICATION_LEVEL.QR
                    : dbGuild.requiredVerification,
            securityNotifiedAt: new Date(),
            verificationLevel:
                (target.nickname || '').includes(activeBound.nickname) || target.user.username.includes(activeBound.nickname)
                ? VERIFICATION_LEVEL.MATCHNICK
                    : VERIFICATION_LEVEL.NONE,
        });
        newUser.syncNickname = newUser.verificationLevel === VERIFICATION_LEVEL.MATCHNICK;

        await newUser.save();

        await Security.processNewUser(newUser, dbGuild);
        const result = await Sync.updateMember(dbGuild, newUser);

        return message.reply(
            `вы успешно ${isAdmin ? `зарегистрировали ${target}` : 'зарегистрировались'}!`
            + ' '
            + `Ник: \`${newUser.nickname}\`, ранг \`${RANKS[newUser.rank]}\``
            + `\n`
            + this.verifyAppendix(newUser, result, isAdmin)
        );

    }

    public async execRegistered(message: Message, args: IRankArgs) {
        const { bound, target, dbUser, isAdmin } = args;

        const dbGuild = await Guild.findByPk(message.guild.id);
        const result = await Sync.updateMember(dbGuild, dbUser);
        if (isAdmin) {
            return message.reply(`пользователь уже зарегистрирован!`);
        } else {
            const time = (await User.count({where: {inactive: false}})) * parseInt(ENV.COOLDOWN) / parseInt(ENV.PACK_SIZE) + dbUser.rankUpdatedAt.valueOf() - Date.now();
            return message.reply(`вы уже зарегистрированы, ${time > 5 * 60 * 1000 ? `обновление ранга будет через \`${
                humanizeDuration(
                    time,
                    {conjunction: ' и ', language: 'ru', round: true},
                )
            }\`` : 'скоро будет обновление ранга' }.\n`
            + this.verifyAppendix(dbUser, result, isAdmin));
        }
    }

    public verifyAppendix = (dbUser: User, status: UpdateStatus, isAdmin: boolean) =>
        dbUser.isInVerification
            ? `*В целях безопасности требуется подтверждение аккаунта Uplay.`
                + ' '
                + (status === UpdateStatus.DM_CLOSED
                    ? (isAdmin ? 'ЛС закрыто.' : `Откройте личные сообщения для <${this.client.user.id}> и повторите попытку.`)
                    : (isAdmin ? ' Инструкции высланы пользователю в ЛС.' : ' Следуйте инструкциям, отправленным в ЛС.'))
                + `*`
            : ''
}
