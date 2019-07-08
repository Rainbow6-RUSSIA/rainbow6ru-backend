import { Guild, MapR6, Match, Team, Tournament, User } from '@r6ru/db';
import { MATCH_TYPE } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { pool } from '../bot';

interface IArgs {
    matchType: 'bo1' | 'bo2' | 'bo3' | 'bo5' | 'bo7';
    pool: string[];
    teams: string[];
    legacy: 'yes' | 'no';
}

let teamPool: Team[] = [];

const { Op } = Sequelize;

function getTeams() {
    (async () => {
        teamPool = await Team.findAll();
    })();
    return '`' + teamPool.map(t => `${t.name} (${t.id})`).join('`, `') + '`';
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
                        start: 'Сколько игр будет в матче (bo1, bo2, bo3, bo5, 7)?',
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
            channel: 'guild',
            defaultPrompt: {
                retries: 3,
                time: 60 * 1000,
                cancel: 'Отмена!',
                retry: 'Неверный ввод!',
            },
        });
    }

    public async exec(message: Message, args: IArgs) {
        const dbTournament = await Tournament.findOne({
            where: {[Op.and]:
                [{guildId: message.guild.id}, {active: true}],
            },
            order: [['id', 'DESC']],
            include: [{all: true}],
        });
        if (!dbTournament) {
            return message.reply('на сервере нет активных турниров!');
        }
        if (!dbTournament.moderators.map(u => u.id).includes(message.author.id)) {
            return message.reply('вы не являетесь модератором турнира');
        }
        const dbTeams = await Team.findAll({ where: { id: args.teams }});
        if (dbTeams.length < 2) {
            return message.reply('команда(-ы) не найдена(-ы)');
        }

        const match = await Match.create<Match>({
            matchType: MATCH_TYPE[args.matchType.toUpperCase()],
            legacy: false,
            mapScore: [0, 0],
            swapped: args.teams[0] > args.teams[1],
        });
        await match.$set('teams', dbTeams);
        await match.$set('tournament', dbTournament);
        await match.reload({include: [{all: true}]});
        match.poolCache = dbTournament.pool.map(p => p.toJSON());
        await match.save();
        return message.reply(`матч создан!\nОверлей банов https://cdn.rainbow6russia.ru/streams/#/map_vote/${match.id}${''/* \nХуд https://cdn.rainbow6russia.ru/streams/header#${match.id} */}`);
        // message.reply('```js\n' + JSON.stringify(match, null, 2) + '```', {split: {prepend: '```js\n', append: '```'}});
    }
}
