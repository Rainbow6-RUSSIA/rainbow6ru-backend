import { ArgumentOptions , Command } from 'discord-akairo';
import { Message, MessageReaction, ReactionEmoji, User } from 'discord.js';

import { UUID } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import r6api from '../../r6api';
import ubiGenome from '../types/ubiGenome';
import ubiNickname from '../types/ubiNickname';

const emojiPrompt = ['', '1⃣', '2⃣'];

export default class Info extends Command {
    public constructor() {
        super('info', {
            aliases: ['info', 'I'],
            args: [{
                    id: 'user',
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
    public exec = async (message: Message, args: {
        user: User,
        genome: UUID,
        nickname: string,
    }) => {
        let { user, genome } = args;
        const { nickname } = args;
        if (!(!user || !nickname)) {
            const prompt = await combinedPrompt(
                await message.reply(`вы ищите информацию о пользователе:\n1) Discord <@${user.id}> или\n2) Uplay \`${nickname}\`?`) as Message,
                {
                    author: message.author,
                    emojis: ['1⃣', '2⃣'],
                    texts: [['1', 'discord'], ['2', 'uplay']],
                },
            );
            switch (prompt) {
                case 1:
                    user = null;
                    break;
                default:
                    genome = null;
                    break;
            }
        }
        console.log(user, nickname, genome);
        console.log(await r6api.getCurrentName('PC', ['964b07cb-0169-4a55-ad59-62c975f227ff', 'c09fc7c9-5d45-4c6c-94e5-2dee159abff3']));
        switch (false) {
            case user !== message.author:
                return message.reply('инфа о себе (напрямую)');
            case !user:
                return message.reply('инфа по мемберу');
            case !nickname:
                return message.reply('инфа по нику');
            case !genome:
                return message.reply('инфа по геному');
            default:
                return message.reply('инфа о себе, так как ничего не найдено');
        }
    }
}
