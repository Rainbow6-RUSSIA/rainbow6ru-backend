// import { TryCatch } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message, Snowflake, User } from 'discord.js';
import { debug } from '../../..';

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
        this.typing = true;
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IArgs) => {
        const user = await (args.user || this.client.users.fetch(args.id.match[0]));
        const member = await message.guild.members.fetch(user.id);
        return message.reply(`пользователь ${user} \`${user.tag}\`: ${
            !member
                ? 'не на сервере'
                : !member.voice.channel
                    ? 'не в голосовом канале'
                    : `находится в <#${member.voice.channel.id}> ${await (
                        async () => {
                            try {
                                const inv = await member.voice.channel.createInvite({maxUses: 5, maxAge: 600, reason: 'поиск по голосовым каналам'});
                                return inv.url;
                            } catch (error) {/* */}
                        }
                    )()}`
        }`);
    }
}
