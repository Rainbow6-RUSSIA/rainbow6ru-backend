import { Guild, User } from '@r6ru/db';
import { ONLINE_TRACKER, UUID } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Collection, Message, Snowflake } from 'discord.js';
import ENV from '../../../utils/env';

export default class Twinks extends Command {
    constructor() {
        super('twinks', {
            aliases: ['twinks', 'counttwinks'],
            channel: 'guild',
            userPermissions: 'BAN_MEMBERS',
        });
    }

    public paragraphSplit = (joinWith: string) => (a: string[], b: string) => {
        if (a.length === 0) { return [b]; }
        const c = a[a.length - 1] + joinWith + b;
        if (c.length <= 2000) {
          a[a.length - 1] = c;
        } else {
          a.push(b);
        }
        return a;
      }

    public exec = async (message: Message) => {
        const dbUsers = await User.findAll({ attributes: ['id', 'genome'] });
        const dbGuild = await Guild.findByPk(message.guild.id, {include: [{all: true}]});
        const twinksCounter = new Collection<UUID, Set<Snowflake>>();
        dbUsers.map(dbUser => twinksCounter.get(dbUser.genome) ? twinksCounter.get(dbUser.genome).add(dbUser.id) : twinksCounter.set(dbUser.genome, new Set([dbUser.id])));
        const filteredTwinks = twinksCounter.filter(g => g.size > 1);
        const bans = await message.guild.fetchBans();
        const genomeBans = new Set([...dbGuild.genomeBlacklist, dbGuild.blacklist.map(u => u.genome)]);
        const answs = filteredTwinks.map(async (set, key) => `• Uplay <${ONLINE_TRACKER}${key}>${genomeBans.has(key)
            ? ' ' + ENV.BAN_BADGE
            : ''
        } привязан:\n◦    ${(await Promise.all([...set]
            .map(async id => `<@${id}> \`${(await this.client.users.fetch(id)).tag}\` ${bans.has(id) ? `${ENV.BAN_BADGE} \`${bans.get(id).reason}\`` : ''}`),
        )).join('\n◦    ')}`);
        const parts = (await Promise.all(answs)).join('\n').split('\n• ').reduce(this.paragraphSplit('\n• '), []);
        for (const part of parts) {
            await message.channel.send(part);
        }
        return message.reply(`найдено ${new Set(filteredTwinks.values()).size} твинков`);
    }
}
