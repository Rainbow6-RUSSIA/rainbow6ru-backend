import { Argument, Command } from 'discord-akairo';
import { GuildMember, Message, TextChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { $enum } from "ts-enum-util";

import r6api from '../../r6api';
import { User } from '../../models/User';
import { Guild } from '../../models/Guild';

import ubiGenome from '../types/ubiGenome';
import ubiGenomeFromNickname from '../types/ubiGenomeFromNickname';
import { IRankArgs, VERIFICATION_LEVEL, PLATFORM, ENV, REGIONS, ONLINE_TRACKER } from '../../utils/types';
import { discordPrompt, buildRankEmbed } from '../../utils/utils';
// import ubiNickname from '../types/ubiNickname';

export default class Rank extends Command {
    public constructor() {
        super('rank', {
            aliases: ['rank', 'rang', 'R'],
            args: [{
                id: 'genome',
                type: ubiGenome,
                unordered: true,
            },{
                id: 'bound',
                type: ubiGenomeFromNickname, // префетч - это слишком пиздато, при ошибках причину хуй поймешь
                unordered: true,
                prompt: {
                    retries: 3,
                    time: 30000,
                    start: 'Введите корректный ник в Uplay!',
                    retry: 'Некорректный ник Uplay! Проверьте правильность и попробуйте еще раз.',
                    ended: 'Слишком много попыток. Проверьте правильность и начните регистрацию сначала.',
                    timeout: 'Время вышло. Начните регистрацию сначала.'
                }
            },{
                id: 'target',
                type: 'member',
                unordered: true,
            }],
            ratelimit: 1,
            cooldown: 10000,
            channel: 'guild'
        });
    }
    public async exec(message: Message, args: IRankArgs) {
        console.log('[Log] rank called');
        try {
            let { bound, genome, target } = args;
            console.log(bound, genome, target);
            let { member, channel } = message;

            if (bound && bound.err) {
                throw bound.err
            }

            if (genome) {
                let currentName = (await r6api.getCurrentName(genome))[0];
                bound = {
                    nickname: currentName.name,
                    genome: currentName.userId
                }
            }

            if (target && member !== target && member.hasPermission('MANAGE_ROLES')) {
                console.log('admin registering');
                let UInst = await User.findById(target.id);
                if (UInst && UInst.genome) {
                    return message.reply(`пользователь уже зарегистрирован!`);
                }
            } else if (target && member !== target) {
                return message.reply('регистрация других пользователей доступна **только администрации**')
            } else {
                target = member;
                let UInst = await User.findById(target.id);
                if (UInst && UInst.genome) {
                    return message.reply(`вы уже зарегистрированы, обновление ранга будет через \`${
                        humanizeDuration(
                            (await User.count({where: {inactive: false}}))*parseInt(ENV.COOLDOWN)/parseInt(ENV.PACK_SIZE)+new Date(UInst.updatedAt).valueOf()-Date.now(),
                            {conjunction: ' и ', language: 'ru', round: true}
                        )
                    }\``)
                }
            }

            let { platformRoles } = await Guild.findById((channel as TextChannel).guild.id);
            let currentRoles = target.roles.keyArray();
            let platform = currentRoles.includes(platformRoles.PC) ? PLATFORM.PC
                : currentRoles.includes(platformRoles.PS4) ? PLATFORM.PS4
                : currentRoles.includes(platformRoles.XBOX) ? PLATFORM.PS4
                : null;
            let rawRank = (await r6api.getRanks(bound.genome))[0];
			// console.log("​Rank -> publicexec -> rawRank", rawRank)
            let regionRank = $enum(REGIONS).map(r => rawRank[r].rank);
            // console.log("​Rank -> publicexec -> regionRank", regionRank)
            let mainRegion = $enum(REGIONS).map(e => e)[regionRank.indexOf(Math.max(...regionRank))] as REGIONS;
			// console.log("​Rank -> publicexec -> mainRegion", mainRegion)
            let stats = (await r6api.getStats(bound.genome))[0];
			// console.log("​Rank -> publicexec -> rawRank[mainRegion]", rawRank[mainRegion])

            let UInst = new User({
                id: target.id,
                genome: bound.genome,
                genomeHistory: [{record: bound.genome, timestamp: Date.now()}],
                nickname: bound.nickname,
                nicknameHistory: [{record: bound.nickname, timestamp: Date.now()}],
                requiredVerification:
                    (Date.now() - target.user.createdTimestamp) < 1000*60*60*24*7 ? VERIFICATION_LEVEL.R6DB
                        : VERIFICATION_LEVEL.NONE,
                verificationLevel:
                    (target.nickname || '').includes(bound.nickname) ||
                        target.user.username.includes(bound.nickname) ? VERIFICATION_LEVEL.MATCHNICK
                            : VERIFICATION_LEVEL.NONE,
                platform,
                region: REGIONS[mainRegion],
                rank: rawRank[mainRegion].rank,
            });

            switch (await discordPrompt(message, `игрок с ником **${bound.nickname}** найден, это верный профиль?\nНажмите реакцию под сообщением для подтверждения`, target.user, {messageOpt: {
                "embed": buildRankEmbed(bound, stats)
            }})) {
                case false: return message.reply('вы отклонили регистрацию. Попробуйте снова, указав нужный аккаунт.');
                case null: return message.reply('время на подтверждение истекло. Попробуйте еще раз и нажмите реакцию для подтверждения.');
                case true: {
                    UInst.save();
                }
            }
            // UInst.pushGenome(bound.genome);
            // UInst.pushNickname(bound.nickname);

        } catch (err) {
            return message.reply(`Ошибка: \`\`\`js\n${err.stack}\`\`\``)
        }
    }
}
