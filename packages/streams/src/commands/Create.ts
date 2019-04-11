import { MapR6, Match, Team, User } from '@r6ru/db';
import { MATCH_TYPE } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { pool } from '../bot';

interface IArgs {
    matchType: 'bo1' | 'bo2' | 'bo3' | 'bo5' | 'bo7';
    pool: string[];
    teams: string[];
    legacy: 'yes' | 'no';
}

let teamPool: Team[] = [];

function getTeams() {
    (async () => {
        teamPool = await Team.findAll();
    })();
    return '`' + teamPool.map((t) => `${t.name} (${t.id})`).join('`, `') + '`';
}

getTeams();

// PIZDA GRYAZNY HACK

export default class Create extends Command {
    public constructor() {
        super('create', {
            aliases: ['create'],
            args: [
                {
                    id: 'matchType',
                    type: ['bo1', 'bo2', 'bo3', 'bo5', 'bo7'],
                    prompt: {
                        start: 'Сколько игр будет в матче (1, 2, 3, 5, 7)?',
                    },
                },
                {
                    id: 'pool',
                    match: 'none',
                    type: pool,
                    prompt: {
                        start: `Введите пул карт в матче. Называйте по одной карте в сообщении. Введите \`stop\` для остановки.\nДоступные карты: \`${pool.join('`, `')}\``,
                        limit: pool.length,
                        infinite: true,
                    },
                },
                {
                    id: 'teams',
                    match: 'none',
                    type: 'number',
                    prompt: {
                        start: () => `Введите 2 команды. Называйте по одному \`id\` в сообщении. Введите \`cancel\` для отмены.\nДоступные команды: ${getTeams()}`,
                        limit: 2,
                        infinite: true,
                    },
                },
            ],
            defaultPrompt: {
                retries: 3,
                time: 60 * 1000,
                cancel: 'Отмена!',
                retry: 'Неверный ввод!',
            },
        });
    }

    public async exec(message: Message, args: IArgs) {
        // Match.create({
        //     creator: await User.findByPk(message.author.id)
        // })
        // console.log(args);
        const dbPool = await MapR6.findAll({
            where: {
                id: args.pool,
            },
        });
        if (dbPool.length % 2 === 0) {
            return message.reply('Количество карт в пуле должно быть нечетным!');
        }

        const dbTeam0 = await Team.findByPk(args.teams[0]);
        const dbTeam1 = await Team.findByPk(args.teams[1]);
        if (!dbTeam0 || !dbTeam1) {
            return message.reply('команда(-ы) не найдена(-ы)');
        }

        const match = await Match.create<Match>({
            matchType: MATCH_TYPE[args.matchType.toUpperCase()],
            legacy: false,
            mapScore: [0, 0],
        });
        await match.$set('creator', await User.findByPk(message.author.id));
        await match.$set('pool', dbPool);
        await match.$set('team0', dbTeam0);
        await match.$set('team1', dbTeam1);
        await match.reload({include: [{all: true}]});
        await match.updateAttributes({
            poolCache: match.tournament.pool.map((p) => p.toJSON()),
        });
        message.reply(`матч создан, id: \`${match.id}\``);
    }
}
