import { Guild, User } from '@r6ru/db';
import { RANKS } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { $enum } from 'ts-enum-util';

export default class Stats extends Command {
    constructor() {
        super('stats', {
            aliases: ['stats'],
            args: [{
                id: 'global',
                type: ['global'],
            }],
            cooldown: 5000,
        });
    }
    public async exec(message: Message, args) {
        if (message.channel.type !== 'text' || args.global) {
            const Users = await User.findAll({ attributes: ['id', 'rank'] });
            const ranksData = $enum(RANKS)
                .getEntries()
                .sort((a, b) => b[1] - a[1])
                .map((e) => [e[0], Users.filter((u) => u.rank === e[1]).length])
                .map((d) => `\`${d[0]}\`: \`${d[1]}\``)
                .join('\n');
            return message.reply(`глобальная статистика пользователей:\n${ranksData}\n**Всего зарегистрировано**: \`${await User.count()}\`\n**Всего активно**: \`${await User.count({where: {inactive: false}})}\``);
        } else {
            const { guild } = message;
            const dbGuild = await Guild.findByPk(guild.id);
            const rankRoles = guild.roles.filter((r) => dbGuild.rankRoles.includes(r.id)).array().sort((a, b) => dbGuild.rankRoles.indexOf(b.id) - dbGuild.rankRoles.indexOf(a.id));
            await guild.members.fetch();
            return message.reply(`статистика пользователей на _**${guild.name}**_\n${rankRoles.map((r) => `\`${r.name}\`: \`${r.members.size}\``).join('\n')}\n**Всего зарегистрировано**: \`${await User.count()}\`\n**Всего активно**: \`${await User.count({where: {inactive: false}})}\``);
        }
    }
}
