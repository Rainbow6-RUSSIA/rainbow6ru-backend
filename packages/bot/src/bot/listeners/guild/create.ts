import { Listener } from "discord-akairo";
import { Guild } from 'discord.js'

export default class Create extends Listener {
    public constructor() {
        super('create', {
            emitter: 'client',
            event: 'guildCreate'
        });
    };
    public exec(guild: Guild) {

    }
}