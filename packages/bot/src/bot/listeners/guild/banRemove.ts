import { Listener } from 'discord-akairo';
import { Guild, User } from 'discord.js';

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
