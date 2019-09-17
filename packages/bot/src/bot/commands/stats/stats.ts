import { Guild, User } from '@r6ru/db';
import { RANKS } from '@r6ru/types';
import {  Command } from 'discord-akairo';
import { CategoryChannel, Message, VoiceChannel } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { $enum } from 'ts-enum-util';
import ENV from '../../../utils/env';

interface IArgs {
    type: 'global' | 'voice' | 'lobby';
}

export default class Stats extends Command {
    constructor() {
        super('stats', {
            aliases: ['stats'],
            args: [{
                id: 'type',
                type: ['global', 'voice', 'lobby'],
            }],
            cooldown: 5000,
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        switch (true) {
            case message.channel.type !== 'text':
            case args.type === 'global': {
                const Users = await User.findAll({ attributes: ['id', 'rank'] });
                const ranksData = $enum(RANKS)
                    .getEntries()
                    .sort((a, b) => b[1] - a[1])
                    .map(e => [e[0], Users.filter(u => u.rank === e[1]).length])
                    .map(d => `\`${d[0]}\`: \`${d[1]}\``)
                    .join('\n');
                return message.reply(`глобальная статистика пользователей:\n${ranksData}\n**Всего зарегистрировано**: \`${await User.count()}\`\n**Всего активно**: \`${await User.count({where: {inactive: false}})}\``);
            }
            case args.type === 'voice': {
                const { guild } = message;
                const dbGuild = await Guild.findByPk(guild.id);
                return message.reply(`всего пользователей в голосовых каналах: \`${
                    guild.channels.filter(ch => ch.type === 'voice')
                        .reduce((acc, val: VoiceChannel) => acc + val.members.size, 0)
                    }\`\n` + Object.entries(dbGuild.voiceCategories)
                                .map(ent => [...ent, (guild.channels.get(ent[1]) as CategoryChannel).children
                                    .filter(ch => ch.type === 'voice')
                                    .reduce((acc, val: VoiceChannel) => acc + val.members.size, 0)])
                                .sort((a, b) => (b[2] as number) - (a[2] as number))
                                .map(ent => `Категория \`${ent[0]}\` - \`${ent[2]}\` пользователей`)
                                .join('\n'));
            }
            case !args.type: {
                const { guild } = message;
                const dbGuild = await Guild.findByPk(guild.id);
                const rankRoles = guild.roles.filter(r => dbGuild.rankRoles.includes(r.id)).array().sort((a, b) => dbGuild.rankRoles.indexOf(b.id) - dbGuild.rankRoles.indexOf(a.id));
                await guild.members.fetch();
                return message.reply(`статистика пользователей на _**${guild.name}**_\n${rankRoles.map(r => `\`${r.name}\`: \`${r.members.size}\``).join('\n')}\n**Всего зарегистрировано**: \`${await User.count()}\`\n**Всего активно**: \`${await User.count({where: {inactive: false}})}\`\n**Зарегистрировано на сервере**: \`${await User.count({where: {id: message.guild.members.map(m => m.id)}})}\``);
            }
        }
    }
}
