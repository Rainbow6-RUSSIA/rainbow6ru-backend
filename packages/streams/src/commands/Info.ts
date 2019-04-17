import { MapR6, Match, Team, Tournament, User, Vote } from '@r6ru/db';
import { combinedPrompt } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';

const { Op } = Sequelize;

export default class Info extends Command {
    constructor() {
        super('info', {
           aliases: ['info', 'I'],
        });
    }

    public async exec(message: Message) {

        const dbTournament = await Tournament.findOne({
            where: {[Op.and]:
                [{guildId: message.guild.id}, {active: true}],
            },
            order: [['id', 'DESC']],
            include: [
                {all: true},
                {model: Match, include: [{all: true}]},
            ],
        });
        if (!dbTournament) {
            return message.reply('на сервере нет активных турниров!');
        }
        if (!dbTournament.moderators.map((u) => u.id).includes(message.author.id)) {
            return message.reply('вы не являетесь модератором турнира');
        }
        const { matches } = dbTournament;
        if (!matches.length) {
            return message.reply('не создано ни одного матча!');
        }
        dbTournament.matches.sort((a, b) => a.id - b.id);
        console.log(dbTournament.matches.map((m) => m.dataValues));
        let match: Match;
        if (matches.length > 1) {
            const pick = await combinedPrompt(
                await message.reply(`уточните, какой матч вы хотите просмотреть:\n${matches.map((m, i) => `${i + 1}. ${m.teams[m.swapped ? 1 : 0].name} vs. ${m.teams[m.swapped ? 0 : 1].name}, id: \`${m.id}\``).join('\n')}`) as Message,
                {
                    author: message.author,
                    texts: new Array(matches.length).fill(0).map((_, i) => (i + 1).toString()),
                },
            );
            if (pick === -1) {
                return message.reply('время вышло.');
            }
            match = matches[pick];
        } else {
            match = matches[0];
        }
        await match.reload({ include: [{all: true}] });
        return message.reply('```js\n' + JSON.stringify(match.dataValues.teams, null, 2) + '```', {split: {prepend: '```js\n', append: '```'}});
    }
}
