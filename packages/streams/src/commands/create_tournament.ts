import { Guild, MapR6, Tournament, User } from '@r6ru/db';
import { DefaultSocial } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';
import { pool as Pool } from '../bot';

interface IArgs {
    name: string;
    shortName: string;
    sponsorsData: string[];
    background: string;
    pool: string[];
    logo: string;
    members: U[];
    socialData: string[];
}

export default class CreateTournament extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('create_tournament', {
            aliases: ['create_tournament', 'T'],
            args: [
                {
                    id: 'name',
                    type: 'string',
                    prompt: {
                        start: 'Введите название турнира:',
                    },
                }, {
                    id: 'shortName',
                    type: 'string',
                    prompt: {
                        start: 'Введите короткое название турнира:',
                    },
                }, {
                    id: 'logo',
                    type: 'string',
                    prompt: {
                        start: 'Введите ссылку с логотипом турнира:',
                    },
                }, {
                    id: 'background',
                    type: 'string',
                    prompt: {
                        start: 'Введите ссылку с фоном турнира (1920х1080):',
                    },
                }, {
                    id: 'sponsorsData',
                    type: 'string',
                    match: 'none',
                    prompt: {
                        start: 'Введите спонсора и, следующей строкой, его баннер. Введите \`stop\` для остановки:',
                        infinite: true,
                    },
                }, {
                    id: 'pool',
                    match: 'none',
                    type: Pool,
                    prompt: {
                        start: `Введите пул карт в турнире. Называйте по одной карте в сообщении. Введите \`stop\` для остановки.\nДоступные карты: \`${Pool.join('`, `')}\``,
                        limit: Pool.length,
                        infinite: true,
                    },
                }, {
                    id: 'members',
                    type: 'user',
                    match: 'none',
                    prompt: {
                        start: 'Упомяните модераторов/кастеров турнира (вы и владелец сервера будете включены автоматически). Введите \`stop\` для остановки:',
                        infinite: true,
                    },
                }, {
                    id: 'socialData',
                    type: 'string',
                    match: 'none',
                    prompt: {
                        start: 'Введите ссылки на социальные сети. Называйте по одной ссылке в сообщении. Введите \`stop\` для остановки:',
                        infinite: true,
                    },
                },
            ],
            channel: 'guild',
        });
    }
    public async exec(message: Message, args: IArgs) {
        const {pool, members, sponsorsData, socialData, ...restArgs} = args;
        const dbPool = await MapR6.findAll({
            where: { id: pool },
        });
        if (dbPool.length % 2 === 0) {
            return message.reply('Количество карт в пуле должно быть нечетным!');
        }
        const social = Object.entries(DefaultSocial).map((e) => {
            e[1] = socialData.filter((s) => s.includes(e[0]));
            return e;
        }).reduce((obj, [k, v]) => ({ ...obj, [k]: v }), DefaultSocial);
        const tournament = await Tournament.create<Tournament>({
            ...restArgs,
            sponsors: sponsorsData.map((s) => s.split('\n')[0]),
            sponsorsBanners: sponsorsData.map((s) => s.split('\n')[1]),
            social,
        });
        const dbUsers = await User.findAll({
            where: {id: [message.guild.ownerID, message.author.id, ...members.map((m) => m.id)]},
        });
        if (dbUsers.length !== members.length) {
            message.reply(`пользователь(-ли) <@${members.filter((m) => !members.map((dbm) => dbm.id).includes(m.id)).map((u) => u.id).join('>, <@')}> не зарегистрированы, поэтому не будут добавлены в состав модераторов.`);
        }
        await tournament.$set('guild', await Guild.findByPk(message.guild.id));
        await tournament.$set('pool', dbPool);
        await tournament.$set('moderators', dbUsers);
        message.reply('команда создана');
        await tournament.reload({include: [{all: true}]});
        message.reply('```js\n' + JSON.stringify(tournament, null, 2) + '```', {split: {prepend: '```js\n', append: '```'}});
    }
}
