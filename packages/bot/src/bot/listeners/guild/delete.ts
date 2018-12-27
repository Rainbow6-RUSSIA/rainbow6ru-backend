import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';

export default class Delete extends Listener {
    public constructor() {
        super('delete', {
            emitter: 'client',
            event: 'guildDelete',
        });
    }
    public exec(guild: Guild) {
        console.log('​Delete -> publicexec -> guild', guild);
    }
}
