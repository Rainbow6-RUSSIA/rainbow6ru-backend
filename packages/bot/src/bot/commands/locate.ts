import { Command } from 'discord-akairo';
import { Message, Snowflake, User } from 'discord.js';

interface IArgs {
    user: User;
    id: { match: RegExpMatchArray };
}

export default class Locate extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('locate', {
            aliases: ['locate'],
            args: [{
                id: 'user',
                type: 'user',
                unordered: true,
            }, {
                id: 'id',
                type: /^(?:<@!?)?(\d{17,21})>?$/,
                unordered: true,
            }],
            channel: 'guild',
            userPermissions: 'MANAGE_ROLES',
        });
    }
    public async exec(message: Message, args: IArgs) {
        const user = await (args.user || this.client.users.fetch(args.id.match[0]));
        let member = null;
        try {
            member = await message.guild.members.fetch(user.id);
        } catch (err) { /* fek */ }
        return message.reply(`пользователь <@${user.id}> \`${user.tag}\`: ${!member ? 'не на сервере' : !member.voice.channel ? 'не в голосовом канале' : `находится в \`${member.voice.channel.name}\` ${await member.voice.channel.createInvite({maxUses: 5, maxAge: 600, reason: 'поиск по голосовым каналам'})}`}`);
    }
}
