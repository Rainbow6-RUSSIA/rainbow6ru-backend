import { ArgumentOptions , Command } from 'discord-akairo';
import { Message, ReactionEmoji, User } from 'discord.js';

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
        let { member, nickname } = args;
        const { genome } = args;
        if (!(!member || !nickname)) {
            const prompt = await message.reply(`вы ищите информацию о пользователе:\n1) Discord <@${args.member.id}> или\n2) Uplay \`${nickname}\`?`) as Message;
            await prompt.react(emojiPrompt[1]);
            await prompt.react(emojiPrompt[2]);
            const emojiFilter = (reaction, user) => emojiPrompt.indexOf[reaction.emoji] !== -1 && user.id === message.author.id;
            const textFilter = (m: Message) => m.author === message.author && (m.content.includes('1') || m.content.includes('2'));
            const race = await Promise.race([prompt.awaitReactions(emojiFilter, { max: 1 }), message.channel.awaitMessages(textFilter, { max: 1 })]);
            const result = race.first();
            if (result instanceof Message) {
                (parseInt(result.content) - 1) ? member = null : nickname = null;
            } else {
                (emojiPrompt.indexOf(result.emoji.name) - 1) ? member = null : nickname = null;
            }
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
