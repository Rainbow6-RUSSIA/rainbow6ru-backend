import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';

import { Guild as G, User as U } from '@r6ru/db';
import { ONLINE_TRACKER, PLATFORM, UUID, VERIFICATION_LEVEL } from '@r6ru/types';
import { combinedPrompt } from '@r6ru/utils';
import { Sequelize } from 'sequelize-typescript';
import { $enum } from 'ts-enum-util';
import r6 from '../../../r6api';
import ENV from '../../../utils/env';
import ubiGenome from '../../types/ubiGenome';
import ubiNickname from '../../types/ubiNickname';

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
                await message.reply(`вы ищите информацию о пользователе:\n1) Discord ${user} или\n2) Uplay \`${nickname}\`?`) as Message,
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
        const idTagTrackerBadge = async (dbUsers: U[]) => (await Promise.all(dbUsers.map(async u => `<@${u.id}> \`${(await this.client.users.fetch(u.id)).tag}\` ${ONLINE_TRACKER}${u.genome}${u.requiredVerification > u.verificationLevel ? ' *требуется верификация*' : ''}${u.verificationLevel >= VERIFICATION_LEVEL.QR ? ' ' + ENV.VERIFIED_BADGE : ''}`))).join('\n');
        switch (true) {
            case user === message.author: {
                const dbUser = await U.findByPk(message.author.id);
                return message.reply(dbUser ? `ваш профиль: ${await idTagTrackerBadge([dbUser])}` : 'вы не зарегистрированы!');
            }
            case Boolean(user): {
                const dbUser = await U.findByPk(user.id);
                return message.reply(dbUser ? `профиль ${await idTagTrackerBadge([dbUser])}` : 'пользователь не найден!');
            }
            case Boolean(nickname): {
                let genomes: string[] = null;
                try {
                    genomes = (await Promise.all($enum(PLATFORM).getValues().map(p => r6.api.findByName(p, nickname)))).map((p, i) => Object.values(p)[0]).filter(p => p).map(p => p.userId);
                } catch (err) {
                    console.log(err);
                }
                let dbUsers: U[] = null;
                if (genomes.length) {
                    dbUsers = await U.findAll({where: {
                        [Op.or]: [
                            {nickname},
                            {nicknameHistory: {[Op.contains]: [nickname.toLowerCase()]}},
                            {genome: genomes},
                            {genomeHistory: {[Op.contains]: genomes}},
                        ],
                    }});
                } else {
                    dbUsers = await U.findAll({where: {
                        [Op.or]: [
                            {nickname},
                            {nicknameHistory: {[Op.contains]: [nickname.toLowerCase()]}},
                        ],
                    }});
                }
                return message.reply(!dbUsers.length ? 'по вашему запросу ничего не найдено!' : `вот что найдено ${!genomes.length ? 'среди сохраненных никнеймов ' : ''}по вашему запросу:\n${await idTagTrackerBadge(dbUsers)}`);
            }
            case Boolean(genome): {
                const dbUsers = await U.findAll({where: {
                    [Op.or]: [
                        {genome},
                        {genomeHistory: {[Op.contains]: [genome]}},
                    ],
                }});
                return message.reply(!dbUsers.length ? 'по вашему запросу ничего не найдено!' : `вот что найдено по вашему запросу:\n${await idTagTrackerBadge(dbUsers)}`);
            }
            default: {
                const dbUser = await U.findByPk(message.author.id);
                return message.reply(dbUser ? `показан ваш профиль, так как по запросу ничего не найдено: ${await idTagTrackerBadge([dbUser])}` : 'по вашему запросу ничего не найдено!');
            }
        }
    }
}
