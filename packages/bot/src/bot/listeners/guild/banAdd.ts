import { Guild as G, User as U } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { Guild, User } from 'discord.js';
import ENV from '../../../utils/env';

export default class BanAdd extends Listener {
    public constructor() {
        super('banAdd', {
            emitter: 'client',
            event: 'guildBanAdd',
        });
    }

    public exec = async (guild: Guild, user: User) => {
        if (ENV.LOBBY_MODE === 'only') { return; }
        const dbGuild = await G.findByPk(guild.id);
        const dbUser = await U.findByPk(user.id);
        if (!dbUser) { return; }

        await dbGuild.$add('blacklist', dbUser);
    }
}
