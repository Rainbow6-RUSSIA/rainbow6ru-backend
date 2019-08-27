import { User } from '@r6ru/db';
import { ONLINE_TRACKER, REGIONS, VERIFICATION_LEVEL } from '@r6ru/types';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { RankInfo, SeasonNumber } from 'r6api.js';
import { Sequelize } from 'sequelize-typescript';
import { $enum } from 'ts-enum-util';
import r6 from '../../../r6api';
import ENV from '../../../utils/env';
import Security from '../../../utils/security';

const { Op } = Sequelize;

interface IArgs {
    // season: SeasonNumber;
    region: REGIONS;
}

export default class HackScan extends Command {
    constructor() {
        super('hack_scan', {
            aliases: ['hack_scan', 'hackscan'],
            args: [{
            //     default: -1,
            //     id: 'season',
            //     type: 'number',
            //     unordered: true,
            // }, {
                id: 'region',
                type: $enum(REGIONS).getValues(),
                unordered: true,
            }],
            channel: 'guild',
            userPermissions: 'MANAGE_GUILD',
        });
    }

    public paragraphSplit = (joinWith: string) => (a: string[], b: string) => {
        if (a.length === 0) { return [b]; }
        const c = a[a.length - 1] + joinWith + b;
        if (c.length <= 2000) {
          a[a.length - 1] = c;
        } else {
          a.push(b);
        }
        return a;
      }

    public exec = async (message: Message, args: IArgs) => {
        const { region } = args;
        const dbUsers = await User.findAndCountAll({
            attributes: ['id', 'genome', 'genomeHistory'],
            where: {
                [Op.and]: [
                    {platform: {PC: true}},
                    {[Op.or]: [{inactive: true}, {rank: 0}]},
                ],
            },
        });
        // admin mode
        const bans = await message.guild.fetchBans();
        const idTagTrackerBadge = async (dbUsrs: User[]) => (await Promise.all(dbUsrs.map(async u => `<@${u.id}> \`${(await this.client.users.fetch(u.id)).tag}\` <${ONLINE_TRACKER}${u.genome}>${u.requiredVerification > u.verificationLevel ? ' *требуется верификация*' : ''}${u.verificationLevel >= VERIFICATION_LEVEL.QR ? ' ' + ENV.VERIFIED_BADGE : ''}${bans.has(u.id) ? `${ENV.BAN_BADGE} \`${bans.get(u.id).reason}\`` : ''}`))).join('\n');
        const genomeChunks = [...new Set<string>([].concat(...dbUsers.rows.map(u => u.genomeHistory)))].reduce((all, one, i) => {
            const ch = Math.floor(i / 200);
            all[ch] = [].concat((all[ch] || []), one);
            return all;
         }, []);
        console.log(dbUsers.count, genomeChunks.length);
        const mapAnsws = await Promise.all(genomeChunks.map(ch => r6.getRank('PC', ch, { season: -1, region: region ? [region] : $enum(REGIONS).getValues()})));
        const answs = new Array<RankInfo>().concat(...mapAnsws.map(a => [...a.values()]));
        const result = answs.filter(Security.analyzeRankStats).map(a => a.id);
        const suspiciousUsers = dbUsers.rows.filter(u => u.genomeHistory.some(g => result.includes(g)));
        const parts = (`<@${message.author.id}>, найдено ${result.length} подозрительных аккаунтов Uplay с удаленной статистикой\n`
        + `Они привязаны или были привязаны у ${suspiciousUsers.length} пользователей\n` + await idTagTrackerBadge(suspiciousUsers)).split('\n').reduce(this.paragraphSplit('\n'), []);
        console.log(parts);
        for (const part of parts) {
            await message.channel.send(part);
        }
    }
}
