import { Guild as G, User as U } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';
import { syncMember } from '../../utils/sync';
interface IUpdateArgs {
    user: User;
    verification: number;
}

export default class Update extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('update', {
            aliases: ['update', 'U'],
            args: [{
                id: 'user',
                type: 'user',
            }, {
                id: 'verification',
                type: 'number',
            }],
            channel: 'guild',
            userPermissions: 'MANAGE_ROLES',
        });
    }
    public async exec(message: Message, args: IUpdateArgs) {
        const UInst = await U.findByPk(args.user.id);
        UInst.requiredVerification = args.verification || UInst.requiredVerification;
        await UInst.save();
        await syncMember(await G.findByPk(message.guild.id), UInst);
        return message.reply('обновлено!');
    }
}
