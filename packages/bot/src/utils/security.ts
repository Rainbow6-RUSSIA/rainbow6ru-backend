import { Guild, Op, User } from '@r6ru/db';
import { ONLINE_TRACKER, UUID, VERIFICATION_LEVEL, VERIFIED_BADGE } from '@r6ru/types';
import { Collection, User as U } from 'discord.js';
// import { RankInfo } from 'r6api.js';
import { $enum } from 'ts-enum-util';
import { debug } from '../';
import bot from '../bot';
import ENV from './env';
import Sync from './sync';

type BanInfo = Collection<string, { user: U, reason: string }>;

export default class Security {
    public static async detectDupes(dbUser: User, dbGuild: Guild, silent?: boolean) {
        let twinks = await User.findAll({
            include: [{ all: true}],
            where: {
                [Op.or]: [
                    {genome: [dbUser.genome]},
                    {genomeHistory: {[Op.contains]: [dbUser.genome]}},
                ],
            },
        });
        if (silent) {
            return twinks;
        }
        const bannedAt = twinks.find(t => t.id === dbUser.id).bannedAt;
        const localBan = bannedAt.length && bannedAt.find(r => r.id === dbGuild.id);
        if (!(localBan?.GuildBlacklist?.allowed)
             && (dbUser.securityNotifiedAt > new Date(Date.now() - 5 * 60 * 1000)
                || dbUser.securityNotifiedAt < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))) {
            if (twinks.length > 1) {
                const guild = bot.guilds.get(dbGuild.id);
                const bans = await guild.fetchBans();
                twinks = twinks.filter(t => t.id !== dbUser.id);
                twinks.unshift(dbUser);
                Security.logDirectDupes(twinks, bans);
                Security.logHistoricalDupes(twinks, bans);
                if (dbUser.securityNotifiedAt < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) {
                    dbUser.securityNotifiedAt = new Date();
                    await dbUser.save();
                }
            }
            if (dbGuild.genomeBlacklist?.includes(dbUser.genome)) {
                debug.error(`Аккаунт Uplay ${dbUser} пользователя <@${dbUser.id}> в черном списке старого бота`);
            }
        }
        return twinks;
    }

    public static async logDirectDupes(twinks: User[], bans: BanInfo) {
        if (twinks.length > 1) {
            debug[twinks.some(t => bans.has(t.id)) ? 'error' : 'warn'](
                'Обнаружена коллизия аккаунтов\n'
                + Security.logString(twinks[0], bans)
                + '\nи\n'
                + twinks
                .filter((t, i, a) => t.genome === a[0].genome)
                .slice(1)
                .map(t => Security.logString(t, bans))
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
                    .map(t => Security.logString(t, bans))
                    .join('\n'));
        }
    }

    public static logString = (twink: User, bans: BanInfo) => `<@${twink.id}> [${ONLINE_TRACKER}...](${twink})${twink.verificationLevel >= VERIFICATION_LEVEL.QR ? ` ${bot.emojis.resolve(VERIFIED_BADGE)}` : ''}${bans.has(twink.id) ? ` ${ENV.BAN_BADGE} - \`${bans.get(twink.id).reason}\`` : ''}`;

    public static async changeGenome(dbUser: User, dbGuild: Guild, genome: UUID) {
        debug.warn(`<@${dbUser.id}> сменил аккаунт с ${dbUser} на ${ONLINE_TRACKER}${genome}. Запрошена верификация`);
        dbUser.genome = genome;
        dbUser.verificationLevel = VERIFICATION_LEVEL.NONE;
        dbUser.requiredVerification = VERIFICATION_LEVEL.QR;
        dbUser.securityNotifiedAt = new Date();
        await dbUser.save();
        return Sync.updateMember(dbGuild, dbUser);
    }

    public static async processNewUser(dbUser: User, dbGuild: Guild) {
        const dupes = await Security.detectDupes(dbUser, dbGuild, true);
        if (dupes.length > 1) {
            dbUser.requiredVerification = VERIFICATION_LEVEL.QR;
            await dbUser.save();
            await debug.error(`<@${dbUser.id}> зарегистрировался как ${dbUser}. Обнаружена повторная регистрация или передача аккаунта.`);
        } else {
            await debug.log(`<@${dbUser.id}> зарегистрировался как ${dbUser}.`);
        }
        if (dbUser.requiredVerification >= VERIFICATION_LEVEL.QR) {
            await debug.log(`автоматически запрошена верификация аккаунта <@${dbUser.id}> ${dbUser}`);
        }
    }

    // public static analyzeRankStats = (data: RankInfo) =>
    //     $enum(REGIONS).getValues().some(r =>
    //         data.regions[r].abandons === 1
    //         && data.regions[r].wins === 0
    //         && data.regions[r].losses === 0
    //         && (
    //             data.regions[r].deaths >= 9
    //             || data.regions[r].kills > 40
    //             || (
    //                 data.regions[r].current.mmr !== 2500
    //                 && data.regions[r].lastMatch.mmrChange
    //                 && Math.abs(data.regions[r].lastMatch.mmrChange) < parseInt(ENV.SUSPICIOUS_MMR_CHANGE))))
}
