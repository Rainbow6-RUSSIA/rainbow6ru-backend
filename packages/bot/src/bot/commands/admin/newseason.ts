import { Guild, User } from '@r6ru/db';
import { combinedPrompt } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import Sync from '../../../utils/sync';

const { Op } = Sequelize;

export default class NewSeason extends Command {
    constructor() {
        super('new_season', {
            aliases: ['new_season', 'newseason'],
            channel: 'guild',
            ownerOnly: true,
        });
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
                where: { id: members.map(m => m.id) }
            };
            await User.update({ rank: 0 }, query);
            const targets = await User.findAll(query);
            await Promise.all(targets.map(t => Sync.updateMember(dbGuild, t)));
            await message.reply('роли обновлены!');
        }
    }
}
