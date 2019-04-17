import { MapR6, Match, Team, Tournament, User, Vote } from '@r6ru/db';
import { combinedPrompt, emojiNumbers } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { io } from '../server';

const { Op } = Sequelize;

export default class Start extends Command {
    public constructor() {
        super('start', {
            aliases: ['start', 'S'],
        });
    }
    public async exec(message: Message) {
        const dbTournament = await Tournament.findOne({
            where: {[Op.and]:
                [{guildId: message.guild.id}, {active: true}],
            },
            order: ['id', 'DESC'],
            include: [{all: true}],
        });
        if (!dbTournament) {
            return message.reply('на сервере нет активных турниров!');
        }
        if (!dbTournament.moderators.map((u) => u.id).includes(message.author.id)) {
            return message.reply('вы не являетесь модератором турнира');
        }
        const { matches } = dbTournament;
        if (!matches.length) {
            return message.reply('вы не создали ни одного матча!');
        }
        let match: Match;
        if (matches.length > 1) {
            const pick = await combinedPrompt(await message.reply(`уточните, какой матч вы хотите запустить:\n${matches.map((m, i) => `${i + 1}. ${m.team0.name} vs. ${m.team1.name}, id: \`${m.id}\``).join('\n')}`) as Message,
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

        await match.updateAttributes({
            poolCache: match.tournament.pool.map((p) => p.toJSON()),
        });

        const c0 = await User.find({where: {teamId: match.team0Id}});
        const c1 = await User.find({where: {teamId: match.team1Id}});
        const caps = [c0.id, c1.id];
        const teamIds = [match.team0Id, match.team1Id];

        await match.$set('votes', null);

        console.log('Initial match', match.toJSON());

        if (!match.legacy) {
                const n = Math.round(Math.random());
                const prmpt = await combinedPrompt(await message.channel.send(`<@${caps[n]}> будете **убирать** карты первыми? (Капитан выбран случайно)`) as Message, {
                    author: this.client.users.get(caps[n]),
                    emojis: ['✅', '❎'],
                    texts: [['да', 'yes', '+'], ['нет', 'no', '-']],
                    time: 15 * 60 * 1000,
                });
                if (prmpt + n === 1) {
                    console.log('Swapping...', [match.team0.dataValues, match.team1.dataValues]);
                    // await match.swap();
                    [caps[0], caps[1]] = [caps[1], caps[0]];
                    [teamIds[0], teamIds[1]] = [teamIds[1], teamIds[0]];
                    await match.reload();
                    await match.save();
                    io.to(match.id + '/map_vote').emit('swap', match.toJSON());
                    io.to(match.id + '/header').emit('swap', match.toJSON());
                    console.log('After...', [match.team0.dataValues, match.team1.dataValues]);
                }
            }

        for (let i = 0; i < match.poolCache.length - 1; i++) {
            console.log('Vote №', i);
            const poolStr = match.tournament.pool.map((m, j) => `${(j + 1).toString(36).toUpperCase()}. **${m.titleRu}**`).join('\n');
            console.log('TCL: Start -> publicexec -> poolStr', `<@${caps[i % 2]}>, **убирайте** одну из следующих карт:\n ${poolStr}`.length);

            const banOrNot = (match.matchType === 'bo1') || (match.matchType === 'bo3' && !([3, 2].includes(i))) || (match.matchType === 'bo5' && !([5, 4, 3, 2].includes(i)));

            const texts = new Array(match.tournament.pool.length).fill(null).map((_, j) => [(j + 1).toString(36), match.tournament.pool[j].id, match.tournament.pool[j].titleEn.toLowerCase(), match.tournament.pool[j].titleRu.toLowerCase()]);
            console.log('TCL: Start -> publicexec -> texts', texts);
            const prmpt = await combinedPrompt(await message.channel.send(`<@${caps[i % 2]}>, **${banOrNot ? 'убирайте' : 'выбирайте'}** одну из следующих карт:\n ${poolStr}`) as Message, {
                author: this.client.users.get(caps[i % 2]),
                emojis: emojiNumbers(match.tournament.pool.length),
                texts,
                time: 15 * 60 * 1000,
            });

            console.log('Prompt resolved', prmpt);

            const vote = await Vote.create<Vote>({type: banOrNot ? 'ban' : 'pick', teamId: teamIds[i % 2], mapId: match.tournament.pool[prmpt].id});
            console.log('Purging pool');
            await match.$remove('pool', match.tournament.pool[prmpt]);
            console.log('Appending vote');
            await match.$add('votes', vote);

            match = await Match.findByPk(match.id, {include: [{all: true}]});
            console.log('Match', match.toJSON());

            io.to(match.id + '/map_vote').emit('map_vote', match.toJSON());
        }

        const decider = await Vote.create<Vote>({type: 'decider', mapId: match.tournament.pool[0].id});
        console.log('Purging pool');
        await match.$remove('pool', match.tournament.pool[0]);
        console.log('Appending vote');
        await match.$add('votes', decider);

        match = await Match.findByPk(match.id, {include: [{all: true}]});

        io.to(match.id + '/map_vote').emit('map_vote', match.toJSON());

        const poolS = match.votes.filter((v) => v.type === 'pick' || v.type === 'decider').map((v, i) => `${(i + 1).toString(36).toUpperCase()}. **${match.poolCache.find((m) => m.id === v.mapId).titleRu}**  (сторону выбирает <@${caps[(i + 1) % 2]}>)`).join('\n');

        return message.reply(`<@${caps[0]}>, <@${caps[1]}> голосование завершено!\nИтоговый набор карт: \n${poolS}`);

    }
}
