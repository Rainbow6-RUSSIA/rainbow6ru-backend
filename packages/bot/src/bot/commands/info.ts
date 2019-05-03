import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';

import { Guild as G, User as U } from '@r6ru/db';
import { ONLINE_TRACKER, PLATFORM, UUID, VERIFICATION_LEVEL } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import { Sequelize } from 'sequelize-typescript';
import { $enum } from 'ts-enum-util';
import { debug } from '../..';
import r6 from '../../r6api';
import ENV from '../../utils/env';
import ubiGenome from '../types/ubiGenome';
import ubiNickname from '../types/ubiNickname';

interface IInfoArgs {
    user: User | { id: string };
    genome: UUID;
    nickname: string;
    id: { match: RegExpMatchArray };
}

const { Op } = Sequelize;

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
                }, {
                    id: 'id',
                    type: /^(?:<@!?)?(\d{17,21})>?$/,
                    unordered: true,
                }],
        });
    }

    // @TryCatch(debug)
    public exec = async (message: Message, args: IInfoArgs) => {
        let { user, genome } = args;
        const { nickname, id } = args;
        if (!user && id) {
            user = { id: id.match[0]};
        }
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
        const addBadge = async (lvl: VERIFICATION_LEVEL) => lvl >= VERIFICATION_LEVEL.QR ? ' ' + ENV.VERIFIED_BADGE : '';
        switch (false) {
            case user !== message.author:
                const U0 = await U.findByPk(message.author.id);
                return message.reply(U0 ? `ваш профиль: ${ONLINE_TRACKER}${U0.genome}${await addBadge(U0.verificationLevel)}` : 'вы не зарегистрированы!');
            case !user:
                const U1 = await U.findByPk(user.id);
                return message.reply(U1 ? `профиль <@${user.id}> \`${(await this.client.users.fetch(user.id)).tag}\`: ${ONLINE_TRACKER}${U1.genome}${await addBadge(U1.verificationLevel)}` : 'пользователь не найден!');
            case !nickname:
                let genomes: string[] = null;
                try {
                    genomes = (await Promise.all($enum(PLATFORM).getValues().map((p) => r6.api.findByName(p, nickname)))).map((p, i) => Object.values(p)[0]).filter((p) => p).map((p) => p.userId);
                } catch (err) {
                    console.log(err);
                }
                let U2: U[] = null;
                if (genomes.length) {
                    U2 = await U.findAll({where: {
                        [Op.or]: [
                            {nickname},
                            {nicknameHistory: {[Op.contains]: [nickname.toLowerCase()]}},
                            {genome: genomes},
                            {genomeHistory: {[Op.contains]: genomes}},
                        ],
                    }});
                } else {
                    U2 = await U.findAll({where: {
                        [Op.or]: [
                            {nickname},
                            {nicknameHistory: {[Op.contains]: [nickname.toLowerCase()]}},
                        ],
                    }});
                }
                return message.reply(!U2.length ? 'по вашему запросу ничего не найдено!' : `вот что найдено ${!genomes ? 'среди сохраненных никнеймов ' : ''}по вашему запросу:\n${(await Promise.all(U2.map(async (u) => `<@${u.id}> \`${(await this.client.users.fetch(u.id)).tag}\` ${ONLINE_TRACKER}${u.genome}${await addBadge(u.verificationLevel)}`))).join('\n')}`);
            case !genome:
                const U3 = await U.findAll({where: {
                    [Op.or]: [
                        {genome},
                        {genomeHistory: {[Op.contains]: [genome]}},
                    ],
                }});
                return message.reply(!U3.length ? 'по вашему запросу ничего не найдено!' : `вот что найдено по вашему запросу:\n${(await Promise.all(U3.map(async (u) => `<@${u.id}> \`${(await this.client.users.fetch(u.id)).tag}\` ${ONLINE_TRACKER}${u.genome}${await addBadge(u.verificationLevel)}`))).join('\n')}`);
            default:
                const U4 = await U.findByPk(message.author.id);
                return message.reply(U4 ? `показан ваш профиль, так как по запросу ничего не найдено: ${ONLINE_TRACKER}${U4.genome}${await addBadge(U4.verificationLevel)}` : 'по вашему запросу ничего не найдено!');
        }
    }
}
