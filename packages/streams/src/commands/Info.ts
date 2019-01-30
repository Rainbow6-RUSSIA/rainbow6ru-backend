import { MapR6, Match, Team, User, Vote } from '@r6ru/db';
import { combinedPrompt } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Info extends Command {
    constructor() {
        super('info', {
           aliases: ['info', 'I'],
        });
    }

    public async exec(message: Message) {
        const matches = await Match.findAll({where: {creatorId: message.author.id}, include: [MapR6, Team, User, Vote]});
        if (!matches.length) {
            return message.reply('вы не создали ни одного матча!');
        }
        let match: Match;
        if (matches.length > 1) {
            const pick = await combinedPrompt(
                await message.reply(`уточните, какой матч вы хотите просмотреть:\n${matches.map((m, i) => `${i + 1}. ${m.teams[0].name} vs. ${m.teams[1].name}\n`)}`)[0],
                {
                    texts: new Array(matches.length).fill(0).map((_, i) => (i + 1).toString()),
                    message,
                },
            );
            if (pick === -1) {
                return message.reply('время вышло.');
            }
            match = matches[pick];
        } else {
            match = matches[0];
        }
        message.reply('```js\n' + JSON.stringify(match.dataValues, null, 2) + '```');
    }
}
