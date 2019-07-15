import { Guild as G, Team, User as U } from '@r6ru/db';
import { ONLINE_TRACKER, PLATFORM, VERIFICATION_LEVEL } from '@r6ru/types';
import { GuildMember, MessageAttachment } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { debug } from '..';
import bot from '../bot';
import r6 from '../r6api';
import ENV from './env';
import { generate } from './qr';
import Security from './security';

export default class Sync {
  public static async updateNicknames(platform: PLATFORM) {
    const dbUsers = await U.findAll({
      limit: 40,
      order: [['nicknameUpdatedAt', 'ASC']],
      where: {platform: {
        [platform]: true,
      }},
    });
    if (!dbUsers.length) { return []; }
    const res = await r6.api.getCurrentName(platform, dbUsers.map(u => u.genome));
    if (!Object.keys(res).length) {
      return dbUsers;
    }
    const before = dbUsers.map(u => u.nickname);
    await Promise.all(dbUsers.map(u => {
      if (res[u.genome] && (u.nickname !== res[u.genome].name)) {
        console.log('[BOT]', u.nickname, '-->', res[u.genome].name);
        u.nickname = res[u.genome].name;
      }
      u.nicknameUpdatedAt = new Date();
      return u.save({ silent: true });
    }));
    return dbUsers.filter((u, i) => before[i] !== u.nickname);
  }

  public static async updateRank(platform: PLATFORM) {
    const dbUsers = await U.findAll({
      limit: parseInt(ENV.PACK_SIZE),
      order: [['rankUpdatedAt', 'ASC']],
      where: {
        inactive: false,
        platform: {[platform]: true}},
    });
    if (!dbUsers.length) { return []; }
    const res = await r6.api.getRank(platform, dbUsers.map(u => u.genome));
    if (!Object.keys(res).length) {
      return dbUsers;
    }
    const before = dbUsers.map(u => u.rank);
    await Promise.all(dbUsers.map(u => {
      if (res[u.genome]) {
        u.rank = u.region ? res[u.genome][u.region].rank : Math.max(res[u.genome].apac.rank, res[u.genome].ncsa.rank, res[u.genome].emea.rank);
      }
      u.rankUpdatedAt = new Date();
      return u.save({ silent: true });
    }));
    return dbUsers.filter((u, i) => before[i] !== u.rank);
  }

  public static async sendQrRequest(dbGuild: G, dbUser: U, member: GuildMember) {
    dbUser.inactive = true;
    await dbUser.save();
    const guild = bot.guilds.get(dbGuild.id);
    await (await guild.members.fetch(dbUser.id)).roles.remove([...dbGuild.rankRoles.filter(Boolean), ...Object.values(dbGuild.platformRoles).filter(Boolean)], 'запрос верификации');
    const QR = await generate(dbUser.genome, dbUser.id);
    try {
      await member.send(
        `Боец, пришло получить статус проверенного игрока 👌\n`
        + `\n`
        + `Для дальнейшей игры необходимо будет подтвердить факт владения аккаунтом Uplay привязанным на Discord канале **${guild.name}**\n`
        + `Для этого нужно установить прикрепленное ниже изображение с QR-кодом на аватар в настройках Uplay и после смены ввести **здесь** команду \`$verify\`\n`
        + `\n`
        + `Ваш привязанный аккаунт - ${ONLINE_TRACKER}${dbUser.genome}\n`
        + `Ссылка на сайт для смены аватара - https://account.ubisoft.com/ru-RU/account-information?modal=change-avatar\n`
        + `Рекомендуем скачать изображение по кнопке "Открыть оригинал" для исключения ошибок.\n`
        + `**После верификации аватар можно сменить назад.** (<https://ubisoft-avatars.akamaized.net/${dbUser.genome}/default_256_256.png>)`,
        new MessageAttachment(Buffer.from(QR.buffer), 'QR-verification.png'),
      );
    } catch (err) {
      debug.error(`Не удается отправить сообщение о верификации <@${dbUser.id}>. Скорее всего ЛС закрыто.`);
      debug.error(err);
    }
    return false;
  }

  public static async sendFillingRequest(dbGuild: G, dbUser: U, member: GuildMember) {
    console.log('Filling request');
  }

  public static async updateMember(dbGuild: G, dbUser: U) {
    if (!dbGuild || !dbUser) { return false; }
    if (!dbGuild.premium) { return false; }
    const guild = bot.guilds.get(dbGuild.id);
    if (!guild.available) { return false; }

    let member: GuildMember = null;
    try {
      member = await guild.members.fetch({ user: dbUser.id, cache: true });
      if (!member) { throw new Error(); }
    } catch (err) {
      dbUser.inactive = true;
      await dbUser.save();
      return false;
    }

    await Security.detectDupes(dbUser, dbGuild);

    if (dbUser.verificationLevel < dbGuild.requiredVerification || dbUser.verificationLevel < dbUser.requiredVerification) {
      return Sync.sendQrRequest(dbGuild, dbUser, member);
    }

    if (dbUser.syncNickname) {
      try {
        await member.setNickname(`${dbUser.teamId ? (await Team.findByPk(dbUser.teamId)).shortName + '.' : ''}${dbUser.nickname}${dbUser.verificationLevel >= VERIFICATION_LEVEL.QR ? ' ✔' : ''}`);
      } catch (err) {
        console.log(err);
      }
    }

    const currentRankRoles = member.roles.keyArray().filter(r => dbGuild.rankRoles.includes(r));
    const platformRolesToApply = Object.entries(dbGuild.platformRoles).filter(k => dbUser.platform[k[0]]).map(k => k[1]);
    let finalRoles = [...new Set([...member.roles.map(r => r.id), ...platformRolesToApply])];

    if (currentRankRoles.length > 1) {
      if (dbGuild.rankRoles[dbUser.rank]) {
        finalRoles = finalRoles.filter(r => !dbGuild.rankRoles.includes(r));
        finalRoles.push(dbGuild.rankRoles[dbUser.rank]);
      }
      console.log(`[BOT] User ${member.user.tag} updated! 1 case`);
    } else if (currentRankRoles.length === 1) {
      const currentRank = dbGuild.rankRoles.indexOf(currentRankRoles[0]);
      if ((dbUser.rank > currentRank || currentRank < dbGuild.fixAfter || dbUser.rank === 0) && currentRankRoles[0] !== dbGuild.rankRoles[dbUser.rank]) {
        finalRoles = [...new Set([...finalRoles, dbGuild.rankRoles[dbUser.rank]].filter(r => r !== dbGuild.rankRoles[currentRank]))];
        console.log(`[BOT] User ${member.user.tag} updated! 2 case`);
      }
    } else {
      if (dbGuild.rankRoles[dbUser.rank]) {
        finalRoles = [...new Set([...finalRoles, dbGuild.rankRoles[dbUser.rank]])];
        console.log(`[BOT] User ${member.user.tag} updated! 3 case`);
      }
    }

    await member.roles.set(finalRoles, 'обновление участника');

    return true;
  }

  public static async updateRoles() {
    const guilds = await G.findAll({where: {premium: true}});

    guilds.map(g => console.log('[BOT] Syncing roles ' + bot.guilds.get(g.id).name));
    const usersAtPlatforms = await Promise.all($enum(PLATFORM).getValues().map(p => Sync.updateRank(p)));
    const users = usersAtPlatforms.reduce((acc, val) => acc.concat(val), []);
    await Promise.all(guilds.map(g => bot.guilds.get(g.id).members.fetch()));
    await Promise.all(guilds.map(g => users.filter(u => bot.guilds.get(g.id).members.has(u.id)).map(u => Sync.updateMember(g, u))).reduce((acc, val) => acc.concat(val), []));
  }

  public static async updateMembernames() {
    const guilds = await G.findAll({where: {premium: true}});

    guilds.map(g => console.log('[BOT] Syncing membernames ' + bot.guilds.get(g.id).name));
    const usersAtPlatforms = await Promise.all($enum(PLATFORM).getValues().map(p => Sync.updateNicknames(p)));
    const users = usersAtPlatforms.reduce((acc, val) => acc.concat(val), []);
    await Promise.all(guilds.map(g => bot.guilds.get(g.id).members.fetch()));
    await Promise.all(guilds.map(g => users.filter(u => bot.guilds.get(g.id).members.has(u.id)).map(u => Sync.updateMember(g, u))).reduce((acc, val) => acc.concat(val), []));

  }

}
