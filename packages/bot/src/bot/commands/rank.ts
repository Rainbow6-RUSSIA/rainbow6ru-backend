import { Argument, Command } from 'discord-akairo';
import { GuildMember, Message, TextChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { $enum } from 'ts-enum-util';

import { Guild, User } from '@r6ru/db';
import r6api from '../../r6api';

import { IRankArgs, ONLINE_TRACKER, PLATFORM, REGIONS, VERIFICATION_LEVEL } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import ENV from '../../utils/env';
import { embeds } from '../../utils/utils';
import ubiGenome from '../types/ubiGenome';
import ubiGenomeFromNickname from '../types/ubiGenomeFromNickname';
// import ubiNickname from '../types/ubiNickname';

export default class Rank extends Command {
    public constructor() {
        super('rank', {
            aliases: ['rank', 'rang', 'R'],
            args: [{
                id: 'genome',
                type: ubiGenome,
                unordered: true,
            }, {
                id: 'bound',
                prompt: {
                    ended: 'Слишком много попыток. Проверьте правильность и начните регистрацию сначала.',
                    retries: 3,
                    retry: 'Некорректный ник Uplay! Проверьте правильность и попробуйте еще раз.',
                    start: 'Введите корректный ник в Uplay!',
                    time: 30000,
                    timeout: 'Время вышло. Начните регистрацию сначала.',
                },
                type: ubiGenomeFromNickname, // префетч - это слишком пиздато, при ошибках причину хуй поймешь
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
    public async exec(message: Message, args: IRankArgs) {
        console.log('[Log] rank called');
        try {
            const { genome } = args;
            let { bound, target } = args;
            console.log(bound, genome, target);
            const { member, channel } = message;

            if (bound && bound.err) {
                throw bound.err;
            }

            if (genome) {
                const currentName = (await r6api.getCurrentName(genome))[0];
                bound = {
                    genome: currentName.userId,
                    nickname: currentName.name,
                };
            }

            let UInst: User = null;

            if (target && member !== target && member.hasPermission('MANAGE_ROLES')) {
                console.log('admin registering');
                UInst = await User.findById(target.id);
                if (UInst && UInst.genome) {
                    return message.reply(`пользователь уже зарегистрирован!`);
                }
            } else if (target && member !== target) {
                return message.reply('регистрация других пользователей доступна **только администрации**');
            } else {
                target = member;
                UInst = await User.findById(target.id);
                if (UInst && UInst.genome) {
                    return message.reply(`вы уже зарегистрированы, обновление ранга будет через \`${
                        humanizeDuration(
                            (await User.count({where: {inactive: false}})) * parseInt(ENV.COOLDOWN) / parseInt(ENV.PACK_SIZE) + new Date(UInst.updatedAt).valueOf() - Date.now(),
                            {conjunction: ' и ', language: 'ru', round: true},
                        )
                    }\``);
                }
            }

            const { platformRoles } = await Guild.findById((channel as TextChannel).guild.id);
            const currentRoles = target.roles.keyArray();
            const platform = {
                PC: currentRoles.includes(platformRoles.PC),
                PS4: currentRoles.includes(platformRoles.PS4),
                XBOX: currentRoles.includes(platformRoles.XBOX),
            };
            const rawRank = (await r6api.getRanks(bound.genome))[0];
            // console.log("​Rank -> publicexec -> rawRank", rawRank)
            const regionRank = $enum(REGIONS).map((r) => rawRank[r].rank);
            // console.log("​Rank -> publicexec -> regionRank", regionRank)
            const mainRegion = $enum(REGIONS).map((e) => e)[regionRank.indexOf(Math.max(...regionRank))] as REGIONS;
            // console.log("​Rank -> publicexec -> mainRegion", mainRegion)
            const stats = (await r6api.getStats(bound.genome))[0];
            // console.log("​Rank -> publicexec -> rawRank[mainRegion]", rawRank[mainRegion])

            UInst = new User({
                genome: bound.genome,
                genomeHistory: [{record: bound.genome, timestamp: Date.now()}],
                id: target.id,
                nickname: bound.nickname,
                nicknameHistory: [{record: bound.nickname, timestamp: Date.now()}],
                platform,
                rank: rawRank[mainRegion].rank,
                region: REGIONS[mainRegion],
                requiredVerification:
                    (Date.now() - target.user.createdTimestamp) < 1000 * 60 * 60 * 24 * 7 ? VERIFICATION_LEVEL.R6DB
                        : VERIFICATION_LEVEL.NONE,
                verificationLevel:
                    (target.nickname || '').includes(bound.nickname) ||
                        target.user.username.includes(bound.nickname) ? VERIFICATION_LEVEL.MATCHNICK
                            : VERIFICATION_LEVEL.NONE,
            });

            const prompt = await combinedPrompt(
                await message.reply(`игрок с ником **${bound.nickname}** найден, это верный профиль?`, { embed: embeds.rank(bound, stats) }) as Message,
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
                    UInst.save();
                }
            }
            // UInst.pushGenome(bound.genome);
            // UInst.pushNickname(bound.nickname);

        } catch (err) {
            return message.reply(`Ошибка: \`\`\`js\n${err.stack}\`\`\``);
        }
    }
}
