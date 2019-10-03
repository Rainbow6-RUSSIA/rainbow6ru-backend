import { Guild } from '@r6ru/db';
import {  Command } from 'discord-akairo';
import { Message } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import { lobbyStores } from '../../../utils/lobby';

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
        if (!args.type) {return; }
        const { guild } = message;
        const dbGuild = await Guild.findByPk(guild.id);
        const localLS = lobbyStores.filter(LS => LS.guild.id === guild.id);
        return message.reply(`всего уникальных пользователей пользователей прошло через лобби с момента их загрузок: \`${
            new Set([].concat(...localLS.map(LS => [...LS.uniqueUsers]))).size
        }\`\n` + Object.keys(dbGuild.lobbySettings)
                    .map(key => localLS.find(LS => LS.settings.type === key))
                    .sort((a, b) => b.uniqueUsers.size - a.uniqueUsers.size)
                    .map(LS => `Категория \`${LS.settings.type}\` - \`${LS.uniqueUsers.size}\` уникальных пользователей за \`${humanizeDuration(Date.now() - LS.loadedAt.valueOf(), {conjunction: ' и ', language: 'ru', round: true})}\``)
                    .join('\n'));
    }
}
