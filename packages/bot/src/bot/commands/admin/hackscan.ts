import { Op, User } from '@r6ru/db';
import { REGIONS } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
// import { RankInfo, SeasonNumber } from 'r6api.js';
import { $enum } from 'ts-enum-util';

interface IArgs {
    // season: SeasonNumber;
    region: REGIONS;
}

export default class HackScan extends Command {
    constructor() {
        super('hack_scan', {
            aliases: ['hack_scan', 'hackscan'],
            args: [
                {
                    //     default: -1,
                    //     id: 'season',
                    //     type: 'number',
                    //     unordered: true,
                    // }, {
                    id: 'region',
                    type: $enum(REGIONS).getValues(),
                    unordered: true,
                },
            ],
            channel: 'guild',
            userPermissions: 'MANAGE_GUILD',
        });
        this.typing = true;
    }

    public paragraphSplit = (joinWith: string) => (a: string[], b: string) => {
        if (a.length === 0) {
            return [b];
        }
        const c = a[a.length - 1] + joinWith + b;
        if (c.length <= 2000) {
            a[a.length - 1] = c;
        } else {
            a.push(b);
        }
        return a;
    };

    public exec = async (message: Message, args: IArgs) => {
        const { region } = args;
        const dbUsers = await User.findAndCountAll({
            attributes: ['id', 'genome', 'genomeHistory'],
            where: {
                [Op.and]: [{ platform: { PC: true } }, { [Op.or]: [{ inactive: true }, { rank: 0 }] }],
            },
        });
        // admin mode
        const bans = await message.guild.fetchBans();
        const badges = async (users: User[]) =>
            (await Promise.all(users.map((u) => u.infoBadge(this.client, true, bans)))).join('\n');
        const genomeChunks = [...new Set<string>([].concat(...dbUsers.rows.map((u) => u.genomeHistory)))].reduce(
            (all, one, i) => {
                const ch = Math.floor(i / 200);
                all[ch] = [].concat(all[ch] || [], one);
                return all;
            },
            [],
        );
        console.log(dbUsers.count, genomeChunks.length);
        const mapAnsws = []; // await Promise.all(genomeChunks.map(ch => r6.getRank('PC', ch, { season: -1, region: region ? [region] : $enum(REGIONS).getValues()})));
        // const answs = new Array<RankInfo>().concat(...mapAnsws.map(a => [...a.values()]));
        const result = []; // answs.filter(Security.analyzeRankStats).map(a => a.id);
        const suspiciousUsers = dbUsers.rows.filter((u) => u.genomeHistory.some((g) => result.includes(g)));
        const parts = (
            `<@${message.author.id}>, найдено ${result.length} подозрительных аккаунтов Uplay с удаленной статистикой\n` +
            `Они привязаны или были привязаны у ${suspiciousUsers.length} пользователей\n` +
            (await badges(suspiciousUsers))
        )
            .split('\n')
            .reduce(this.paragraphSplit('\n'), []);
        console.log(parts);
        for (const part of parts) {
            await message.channel.send(part);
        }
    };
}
