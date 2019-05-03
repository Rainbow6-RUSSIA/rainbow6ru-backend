// import { TryCatch } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';
import * as humanizeDuration from 'humanize-duration';
import * as os from 'os';
import * as PrettyBytes from 'pretty-bytes';
import { debug } from '../..';

export default class System extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('system', {
            aliases: ['system'],
            ownerOnly: true,
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message) => {
        message.reply(`Free RAM: ${PrettyBytes(os.freemem())}
Total RAM: ${PrettyBytes(os.totalmem())}
Load: ${os.loadavg()}
Uptime: ${humanizeDuration(os.uptime(), {conjunction: ' и ', language: 'ru', round: true})}`);
        return message.reply(`CPU: \`\`\`json\n${JSON.stringify(os.cpus(), null, 4)}\`\`\`\n`, { split: {prepend: '```json\n', append: '```'} });
    }
}
