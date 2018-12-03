import { Listener } from "discord-akairo";
import { Guild, User } from 'discord.js'

export default class BanRemove extends Listener {
    public constructor() {
        super('banRemove', {
            emitter: 'client',
            event: 'guildBanRemove'
        });
    };
    public exec(guild: Guild, user: User) {

    }
}