import { Guild } from '@r6ru/db';
import { Command, Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';

export default class LFGPurge extends Inhibitor {
    constructor() {
        super('party', {
            reason: 'party',
        });
    }

    public async exec(message: Message, cmd: Command) {
        if (message.channel.type === 'text') {
            const dbGuild = await Guild.findByPk(message.guild.id);
            return dbGuild && dbGuild.lobbySettings && Object.values(dbGuild.lobbySettings).filter(ent => ent.enabled).map(ls => ls.lfg).includes(message.channel.id);
        }
        return false;
    }
}
