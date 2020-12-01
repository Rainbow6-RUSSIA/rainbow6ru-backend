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
            await message.reply('вы уверены, что хотите сбросить роли?'),
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
                returning: true,
                where: { 
                    id: members.filter(m => m.roles.some(r => dbGuild.rankRoles.slice(1).includes(r.id))).map(m => m.id)
                }
            };
            const [N, targets] = await User.update({ rank: 0 }, query);
            let i = 0;
            await Promise.all(
                targets.map(t => 
                    Sync.updateMember(dbGuild, t)
                    .then(() => {
                        i++;
                        if (i % 100 === 0) message.channel.send(`${i}/${N}/${(100 * i / N).toFixed(2)}% ПРОГРЕСС ОБНОВЛЕНИЯ НОВОГО СЕЗОНА`);
                    })
                )
            );
            await message.reply('роли сброшены!');
        }
    }
}
