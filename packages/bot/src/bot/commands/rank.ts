import { Argument, Command } from 'discord-akairo';
import { GuildMember, Message, TextChannel } from 'discord.js';
import humanizeDuration from 'humanize-duration';

import r6api from '../../r6api';
import { User } from '../../models/User';
import { Guild } from '../../models/Guild';

import ubiGenome from '../types/ubiGenome';
import ubiGenomeFromNickname from '../types/ubiGenomeFromNickname';
import { IRankArgs, VERIFICATION_LEVEL, PLATFORM, ENV } from '../../utils/types';
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

            if (target && member !== target && member.hasPermission('MANAGE_ROLES')) {
                console.log('admin registering');
                let UInst = await User.findById(target.id);
                console.log(UInst);
            } else if (target && member !== target) {
                return message.reply('регистрация других пользователей доступна **только администрации**')
            } else {
                target = member;
                let UInst = await User.findById(target.id);
                console.log(UInst);
                if (UInst) {
                    return message.reply(`вы уже зарегистрированы, обновление ранга будет через \`${
                        humanizeDuration((await User.count({where: {inactive: false}}))*parseInt(ENV.COOLDOWN)/parseInt(ENV.PACK_SIZE), {})
                    }\``)
                }
            }

            let { platformRoles } = await Guild.findById((channel as TextChannel).guild.id)
            let currentRoles = target.roles.keyArray();

            let UInst = await User.create({
                id: target.id,
                genome:
                    genome || bound.genome,
                requiredVerification:
                    (Date.now() - target.user.createdTimestamp) < 1000*60*60*24*7 ? VERIFICATION_LEVEL.R6DB
                        : VERIFICATION_LEVEL.NONE,
                verificationLevel:
                    target.nickname.includes(bound.nickname) ||
                    target.user.username.includes(bound.nickname),
                platform:
                    currentRoles.includes(platformRoles.PC) ? PLATFORM.PC
                        : currentRoles.includes(platformRoles.PS4) ? PLATFORM.PS4
                        : currentRoles.includes(platformRoles.XBOX) ? PLATFORM.PS4
                        : null,
            });
            if (genome) {
                UInst.pushGenome(genome)
            } else {
                UInst.pushNickname(bound.nickname)
            }

        } catch (err) {
            return message.reply(`Ошибка: \`\`\`${err.stack}\`\`\``)
        }
    }
}
