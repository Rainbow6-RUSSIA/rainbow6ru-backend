import { Listener } from "discord-akairo";
import { Guild, User } from 'discord.js'

export default class BanAdd extends Listener {
    public constructor() {
        super('banAdd', {
            emitter: 'client',
            event: 'guildBanAdd'
        });
    };
    public exec(guild: Guild, user: User) {

    }
}