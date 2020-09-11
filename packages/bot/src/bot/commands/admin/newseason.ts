import { Guild, User } from '@r6ru/db';
import { combinedPrompt } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '../../..';
import Sync from '../../../utils/sync';

const { Op } = Sequelize;

export default class NewSeason extends Command {
    constructor() {
        super('new_season', {
            aliases: ['new_season', 'newseason'],
            channel: 'guild',
            ownerOnly: true,
        });
        this.typing = true;
    }

    public exec = async (message: Message) => {
        const res = await combinedPrompt(
            await message.reply('вы уверены, что хотите сбросить статистику?'),
            {
                author: message.author,
                emojis: ['✅', '❎'],
                texts: [['yes', 'да', '+'], ['no', 'нет', '-']],
            }
        );
        if (res === 0) {
            const { guild } = message;
            const dbGuild = await Guild.findByPk(guild.id);
            const members = await guild.members.fetch();
            const query = {
                where: {
                    [Op.and]: [
                        { id: members.filter(m => !m.roles.has(dbGuild.rankRoles[0])).map(m => m.id) },
                        {inactive: false},
                        {rank: 0},
                    ],
                }
            };
            // await User.update({ rank: 0 }, query);
            const targets = await User.findAll(query);
            let i = 0;
            await Promise.all(targets.map(t => Sync.updateMember(dbGuild, t).then(() => {
                i++;
                if (!(i % 25)) { 
                    debug.log(`${i}/${targets.length}/${(100 * i / targets.length).toPrecision(3)}% ПРОГРЕСС ОБНОВЛЕНИЯ НОВОГО СЕЗОНА`);
                }
            })));
            await message.reply('роли обновлены!');
        }
    }
}
