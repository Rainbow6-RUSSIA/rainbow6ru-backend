import { Guild, User } from '@r6ru/db';
import { ONLINE_TRACKER, UUID, VERIFICATION_LEVEL } from '@r6ru/types';
import { Collection, User as U } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '../';
import bot from '../bot';
import ENV from './env';
import Sync from './sync';

const { Op } = Sequelize;

type BanInfo = Collection<string, { user: U, reason: string }>;

export default class Security {
    public static async detectDupes(dbUser: User, dbGuild: Guild) {
        let twinks = await User.findAll({ where: {
            [Op.or]: [
                {genome: [dbUser.genome]},
                {genomeHistory: {[Op.contains]: [dbUser.genome]}},
            ],
        }});
        if (dbUser.updatedAt > (Date.now() - 5 * 60 * 1000) || dbUser.updatedAt < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
            if (twinks.length > 1) {
                const guild = bot.guilds.get(dbGuild.id);
                const bans = await guild.fetchBans();
                twinks = twinks.filter((t) => t.id !== dbUser.id);
                twinks.unshift(dbUser);
                Security.logDirectDupes(twinks, bans);
                Security.logHistoricalDupes(twinks, bans);
                if (dbUser.updatedAt < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
                    dbUser.updatedAt = new Date();
                    await dbUser.save();
                }
            }
        }
        return twinks;
    }

    public static async logDirectDupes(twinks: User[], bans: BanInfo) {
        if (twinks.length > 1) {
            debug[twinks.some((t) => bans.has(t.id)) ? 'error' : 'warn'](
                'Обнаружена коллизия аккаунтов\n'
                + Security.logString(twinks[0], bans)
                + '\nи\n'
                + twinks
                .filter((t, i, a) => t.genome === a[0].genome)
                .slice(1)
                .map((t) => Security.logString(t, bans))
                .join('\n'));
        }
    }
    public static async logHistoricalDupes(twinks: User[], bans: BanInfo) {
        const filteredTwinks = twinks.filter((t, i, a) => i === 0 || t.genome !== a[0].genome);
        if (filteredTwinks.length > 1) {
            debug.warn(
                'Обнаружена передача аккаунта к\n'
                + Security.logString(twinks[0], bans)
                + '\nот\n'
                + filteredTwinks
                    .slice(1)
                    .map((t) => Security.logString(t, bans))
                    .join('\n'));
        }
    }

    public static logString = (twink: User, bans: BanInfo) => `<@${twink.id}> [${ONLINE_TRACKER}...](${ONLINE_TRACKER}${twink.genome})${twink.verificationLevel >= VERIFICATION_LEVEL.QR ? ' ' + ENV.VERIFIED_BADGE : ''}${bans.has(twink.id) ? ` ${ENV.BAN_BADGE} - \`${bans.get(twink.id).reason}\`` : ''}`;

    public static async changeGenome(dbUser: User, dbGuild: Guild, genome: UUID) {
        debug.warn(`<@${dbUser.id}> сменил аккаунт с ${ONLINE_TRACKER}${dbUser.genome} на ${ONLINE_TRACKER}${genome}. Запрошена верификация`);
        dbUser.genome = genome;
        dbUser.verificationLevel = VERIFICATION_LEVEL.NONE;
        dbUser.requiredVerification = VERIFICATION_LEVEL.QR;
        await dbUser.save();
        return Sync.updateMember(dbGuild, dbUser);
    }
}
