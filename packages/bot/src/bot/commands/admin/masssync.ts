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
        super('masssync', {
            aliases: ['masssync'],
            channel: 'guild',
            ownerOnly: true,
        });
        this.typing = true;
    }

    public exec = async (message: Message) => {
        const { guild } = message;
        const dbGuild = await Guild.findByPk(guild.id);
        const members = await guild.members.fetch();
        const query = {
            attributes: ['id', 'rank', 'verificationLevel', 'requiredVerification', 'inactive'],
            where: {
                id: members.map(m => m.id)
            }
        };
        const users = (await User.findAll(query))
            .filter(u => {
                const member = members.get(u.id);
                return u.inactive && dbGuild.rankRoles.some(r => member.roles.has(r))
                    || !u.inactive && !member.roles.has(dbGuild.rankRoles[u.rank])
            });
        let i = 0;
        const N = users.length

        const progress = await message.channel.send(`\`${i}/${N}/${(100 * i / N).toFixed(2)}%\` ПРОГРЕСС СИНХРОНИЗАЦИИ РОЛЕЙ`);
        await progress.pin();

        await Promise.all(
            users.map(t =>
                Sync.updateMember(dbGuild, t)
                    .then(() => {
                        i++;
                        if (i % 25 === 0) progress.edit(`\`${i} / ${N} / ${(100 * i / N).toFixed(2)}%\` ПРОГРЕСС СИНХРОНИЗАЦИИ РОЛЕЙ`);
                    })
            )
        );
        await message.reply('роли синхронизированы!');
    }

}
