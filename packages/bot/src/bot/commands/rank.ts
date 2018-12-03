import { Argument, Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';

import r6api from '../../r6api';
import { User } from '../../models/User';
import { Guild } from '../../models/Guild';

import ubiGenome from '../types/ubiGenome';
import ubiGenomeFromNickname from '../types/ubiGenomeFromNickname';

export default class Rank extends Command {
    public constructor() {
        super('rank', {
            aliases: ['rank', 'rang', 'R'],
            args: [{
                id: 'genome',
                type: ubiGenome,
                unordered: true,
            },{
                id: 'nickname',
                type: ubiGenomeFromNickname,
                unordered: true,
                prompt: {
                    retries: 3,
                    time: 30000,
                    start: 'Введите корректный ник в Uplay!',
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
    public async exec(message: Message, args) {
        try {
            let { nickname, genome, target } = args;
            let { member, channel } = message;
            if (target) {
                if (member.hasPermission('MANAGE_ROLES')) {
                    let { platformRoles } = await Guild.findById((channel as TextChannel).guild.id)
                    let UInst = await User.findOrCreate({
                        where: {
                            id: target,
                            // genome: genome || await r6api.findByName(nickname),
                            genome: genome || nickname.genome,
                            verificationLevel: target.nickname.include(nickname.nickname) || target.user.username.include(nickname.nickname),
                            platform: target.roles.keyArray().include(platformRoles.PC) ? 'PC' :
                                (target.roles.keyArray().includes(platformRoles.PS4) ? 'PS4' : 'XBOX')
                        }
                    });
                    if (genome) {
                        UInst[0].pushGenome(genome)
                    } else {
                        UInst[0].pushNickname(nickname.nickname)
                    }
                } else {

                }
            } else {

            }
        } catch (err) {
            return message.util.reply(`Ошибка: \`\`\`${err.stack}\`\`\``)
        }
    }
}
