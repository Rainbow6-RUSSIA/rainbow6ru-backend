import { Guild } from '@r6ru/db';
import {  Command } from 'discord-akairo';
import { Message } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { lobbyStores } from '../../lobby';

interface IArgs {
    type: 'global' | 'voice' | 'lobby';
}

export default class Stats extends Command {
    constructor() {
        super('stats', {
            aliases: ['stats'],
            args: [{
                id: 'type',
                type: ['lobby'],
            }],
            cooldown: 5000,
        });
    }

    public exec = async (message: Message, args: IArgs) => {
        const { guild } = message;
        const dbGuild = await Guild.findByPk(guild.id);
        const vCat = Object.values(dbGuild.voiceCategories);
        const localLS = lobbyStores.filter(LS => vCat.includes(LS.categoryId));
        return message.reply(`всего уникальных пользователей пользователей прошло через лобби с момента их загрузок: \`${
            new Set([].concat(...localLS.map(LS => [...LS.uniqueUsers]))).size
        }\`\n` + Object.entries(dbGuild.voiceCategories)
                    .map(ent => localLS.find(LS => LS.type === ent[0]))
                    .sort((a, b) => b.uniqueUsers.size - a.uniqueUsers.size)
                    .map(LS => `Категория \`${LS.type}\` - \`${LS.uniqueUsers.size}\` уникальных пользователей за \`${humanizeDuration(Date.now() - LS.loadedAt.valueOf(), {conjunction: ' и ', language: 'ru', round: true})}\``)
                    .join('\n'));
    }
}
