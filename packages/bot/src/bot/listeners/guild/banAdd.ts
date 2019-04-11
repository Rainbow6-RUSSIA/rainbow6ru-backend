import { Guild as G, User as U } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { Guild, User } from 'discord.js';

export default class BanAdd extends Listener {
    public constructor() {
        super('banAdd', {
            emitter: 'client',
            event: 'guildBanAdd',
        });
    }
    public async exec(guild: Guild, user: User) {
        const dbGuild = await G.findByPk(guild.id);
        const dbUser = await U.findByPk(user.id);
        await dbGuild.$add('blacklist', dbUser);
    }
}
