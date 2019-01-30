import { Team, User } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message, User as U } from 'discord.js';
import { Op } from 'sequelize';

interface IArgs {
    name: string;
    shortName: string;
    logo: string;
    captain: U;
    members: U[];
}

export default class CreateTeam extends Command { // update all|newseason|numofpacks
    public constructor() {
        super('create_team', {
            aliases: ['create_team', 'CT'],
            args: [
                {
                    id: 'name',
                    type: 'string',
                    prompt: {
                        start: 'Введите название команды:',
                    },
                }, {
                    id: 'shortName',
                    type: 'string',
                    prompt: {
                        start: 'Введите короткое название команды (тег):',
                    },
                }, {
                    id: 'logo',
                    type: 'string',
                    prompt: {
                        start: 'Введите ссылку с логотипом команды:',
                    },
                }, {
                    id: 'captain',
                    type: 'user',
                    prompt: {
                        start: 'Упомяните капитана:',
                    },
                }, {
                    id: 'members',
                    type: 'user',
                    match: 'none',
                    prompt: {
                        start: 'Упомяните состав команды (без капитана). Упоминайте по одному участнику в сообщении. Участник должен быть зарегистрирован. Введите \`stop\` для остановки.',
                        infinite: true,
                    },
                },
            ],
        });
    }
    public async exec(message: Message, args: IArgs) {
    console.log('TCL: CreateTeam -> publicexec -> args', args);
    const {name, shortName, logo} = args;
    const team = await Team.create<Team>({name, shortName, logo});
    const captain = await User.findByPk(args.captain.id);
    if (!captain) {
        return message.reply('капитан не зарегистрирован!');
    }
    team.$set('captain', captain);
    const members = await User.findAll({where: {id: args.members.map((m) => m.id)}});
    if (members.length !== args.members.length) {
            message.reply(`пользователь(-ли) <@${args.members.filter((m) => !members.map((dbm) => dbm.id).includes(m.id)).map((u) => u.id).join('>, <@')}> не зарегистрированы, поэтому не будут добавлены в команду.`);
        }
    team.$set('members', members);
    message.reply('команда создана');
    }
}
