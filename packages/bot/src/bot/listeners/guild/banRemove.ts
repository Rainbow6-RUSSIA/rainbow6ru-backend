import { Guild as G, User as U } from '@r6ru/db';
import { Listener } from 'discord-akairo';
import { Guild, User } from 'discord.js';
import { debug } from '../../..';
import ENV from '../../../utils/env';

export default class BanRemove extends Listener {
    public constructor() {
        super('banRemove', {
            emitter: 'client',
            event: 'guildBanRemove',
        });
    }

    public exec = async (guild: Guild, user: User) => {
        // const dbGuild = await G.findByPk(guild.id);
        // const dbUser = await U.findByPk(user.id);
        // await dbGuild.$remove('blacklist', dbUser);
    };
}
