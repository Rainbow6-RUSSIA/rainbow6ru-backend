import { ArgumentOptions , Command } from 'discord-akairo';
import { Message, MessageReaction, ReactionEmoji, User } from 'discord.js';

import { User as U } from '@r6ru/db';
import { ONLINE_TRACKER, PLATFORM, UUID } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import { Op } from 'sequelize';
import { $enum } from 'ts-enum-util';
import r6api from '../../r6api';
// import r6api from '../../r6api';
import ubiGenome from '../types/ubiGenome';
import ubiNickname from '../types/ubiNickname';

const emojiPrompt = ['', '1⃣', '2⃣'];

export default class Info extends Command {
    public constructor() {
        super('info', {
            aliases: ['info', 'I'],
            args: [{
                    id: 'user',
                    type: 'user',
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
        // console.log(user, nickname, genome);
        // console.log(await r6api.getCurrentName('PC', ['964b07cb-0169-4a55-ad59-62c975f227ff', 'c09fc7c9-5d45-4c6c-94e5-2dee159abff3']));
        switch (false) {
            case user !== message.author:
                const U0 = await U.findByPk(message.author.id);
                return message.reply(U0 ? `ваш профиль: ${ONLINE_TRACKER}${U0.genome}` : 'вы не зарегистрированы!');
            case !user:
                const U1 = await U.findByPk(user.id);
                return message.reply(U1 ? `профиль <@${user.id}>: ${ONLINE_TRACKER}${U1.genome}` : 'пользователь не найден!');
            case !nickname:
                const genomes = (await Promise.all($enum(PLATFORM).getValues().map((p) => r6api.findByName(p, nickname)))).map((p, i) => Object.values(p)[0]).filter((p) => p).map((p) => p.userId);
                const U2 = await U.findAll({where: {
                    [Op.or]: [
                        {nickname},
                        {nicknameHistory: {[Op.contains]: [nickname.toLowerCase()]}},
                        {genome: genomes},
                        {genomeHistory: {[Op.contains]: genomes}},
                    ],
                }});
                return message.reply(!U2.length ? 'по вашему запросу ничего не найдено!' : `вот что найдено по вашему запросу:\n${(await Promise.all(U2.map(async (u) => `<@${u.id}> \`${(await this.client.users.fetch(u.id)).tag}\` ${ONLINE_TRACKER}${u.genome}`))).join('\n')}`);
            case !genome:
                const U3 = await U.findAll({where: {
                    [Op.or]: [
                        {genome},
                        {genomeHistory: {[Op.contains]: [genome]}},
                    ],
                }});
                return message.reply(!U3.length ? 'по вашему запросу ничего не найдено!' : `вот что найдено по вашему запросу:\n${(await Promise.all(U3.map(async (u) => `<@${u.id}> \`${(await this.client.users.fetch(u.id)).tag}\` ${ONLINE_TRACKER}${u.genome}`))).join('\n')}`);
            default:
                const U4 = await U.findByPk(message.author.id);
                return message.reply(U4 ? `показан ваш профиль, так как по запросу ничего не найдено: ${ONLINE_TRACKER}${U4.genome}` : 'по вашему запросу ничего не найдено!');
        }
    }
}
