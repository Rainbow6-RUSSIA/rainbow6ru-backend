import { ArgumentOptions , Command } from 'discord-akairo';
import { Message, MessageReaction, ReactionEmoji, User } from 'discord.js';

import ubiGenome from '../types/ubiGenome';
import ubiNickname from '../types/ubiNickname';

const emojiPrompt = ['', '1⃣', '2⃣'];

export default class Info extends Command {
    public constructor() {
        super('info', {
            aliases: ['info', 'I'],
            args: [{
                    id: 'member',
                    type: 'relevant',
                    unordered: true,
                }, {
                    id: 'genome',
                    type: ubiGenome,
                    unordered: true,
                }, {
                    id: 'nickname',
                    type: ubiNickname,
                    unordered: true,
                }],
        });
    }
    public exec = async (message: Message, args) => {
        const { member, nickname } = args;
        const { genome } = args;
        if (!(!member || !nickname)) {
            const prompt = await message.reply(`вы ищите информацию о пользователе:\n1) Discord <@${args.member.id}> или\n2) Uplay \`${nickname}\`?`) as Message;

            // if (result instanceof Message) {
            //     (parseInt(result.content) - 1) ? member = null : nickname = null;
            // } else {
            //     (emojiPrompt.indexOf(result.emoji.name) - 1) ? member = null : nickname = null;
            // }
        }
        console.log(member, nickname, genome);
        switch (false) {
            case !member:
                return message.reply('инфа по мемберу');
            case !nickname:
                return message.reply('инфа по нику');
            case !genome:
                return message.reply('инфа по геному');
            default:
                return message.reply('инфа о себе');
        }
    }
}
