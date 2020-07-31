import { Guild as G, Team, User as U } from '@r6ru/db';
import { ONLINE_TRACKER, PLATFORM, UpdateStatus, VERIFICATION_LEVEL } from '@r6ru/types';
import { GuildMember, MessageAttachment } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { debug } from '..';
import bot from '../bot';
import ENV from './env';
import { generate } from './qr';
import r6 from './r6api';
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
      if (res[u.genome] && u.nickname !== res[u.genome].name) {
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
        platform: (platform === PLATFORM.PC ? {PC: true} : {PC: false, [platform]: true}),
      }
    });
    if (!dbUsers.length || (dbUsers[0].rankUpdatedAt.valueOf() + 50 * parseInt(ENV.COOLDOWN) > Date.now())) { return []; }
    const res = await r6.api.getRank(platform, dbUsers.map(u => u.genome));
    if (!Object.keys(res).length) {
      return dbUsers;
    }
    const before = dbUsers.map(u => u.rank);
    await Promise.all(dbUsers.map(u => {
      if (res[u.genome]) {
        // if (Security.analyzeRankStats(res.get(u.genome))) {
        //   debug.error(`<@${u.id}> имеет подозрительный аккаунт Uplay с удаленной статистикой ${u}`);
        // }
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
        `Боец, пришло время получить статус проверенного игрока!\n`
        + `А заодно обезопасить себя от недоразумений и поднять уровень доверия к себе со стороны других пользователей 👌\n`
        + `\n`
        + `Для дальнейшей игры необходимо подтвердить факт владения аккаунтом Uplay, привязанным на Discord канале **${guild.name}**.\n`
        + `Для этого нужно:\n`
        + `1) Нажать на прикрепленное ниже изображение с QR-кодом и скачать с помощью кнопки **"Открыть оригинал"**.\n`
        + `2) Установить QR-код на аватар своего аккаунта в **Uplay**.\n`
        + `3) Ввести команду \`$verify\` в ответ на __**это**__ сообщение.\n`
        + `\n`
        + `Ваш привязанный аккаунт - ${dbUser}\n`
        + `Сменить аватар можно по ссылке - <https://account.ubisoft.com/ru-RU/account-information?modal=change-avatar>\n`
        + `или открыв Ubisoft Club из Uplay - <https://i.imgur.com/zZuF7pA.png>\n`
        + `\n`
        + `**После верификации аватар можно сменить назад.**\n`
        + `(текущий можно сохранить по ссылке <https://ubisoft-avatars.akamaized.net/${dbUser.genome}/default_256_256.png>)`,
        new MessageAttachment(Buffer.from(QR.buffer), 'QR-verification.png'),
      );
    } catch (err) {
      debug.error(`Не удается отправить сообщение о верификации <@${dbUser.id}>. Скорее всего ЛС закрыто.`);
      debug.error(err);
      return UpdateStatus.DM_CLOSED;
    }
    return UpdateStatus.VERIFICATION_SENT;
  }

  public static async sendFillingRequest(dbGuild: G, dbUser: U, member: GuildMember) {
    console.log('Filling request');
  }

  public static async updateMember(dbGuild: G, dbUser: U) {
    if (!dbGuild || !dbUser) { return UpdateStatus.INCORRECT_CALL; }
    if (!dbGuild.premium) { return UpdateStatus.GUILD_NONPREMIUM; }
    const guild = bot.guilds.get(dbGuild.id);
    if (!guild.available) { return UpdateStatus.GUILD_UNAVAILABLE; }

    let member: GuildMember = null;
    try {
      member = await guild.members.fetch({ user: dbUser.id, cache: true });
      if (!member) { throw new Error(); }
    } catch (err) {
      dbUser.inactive = true;
      await dbUser.save();
      return UpdateStatus.GUILD_LEFT;
    }

    await Security.detectDupes(dbUser, dbGuild);

    if (dbUser.verificationLevel < dbGuild.requiredVerification || dbUser.isInVerification) {
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

    return UpdateStatus.SUCCESS;
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
    // const usersAtPlatforms = await Promise.all($enum(PLATFORM).getValues().map(p => ));
    const users = await Sync.updateNicknames(PLATFORM.PC); // usersAtPlatforms.reduce((acc, val) => acc.concat(val), []);
    await Promise.all(guilds.map(g => bot.guilds.get(g.id).members.fetch()));
    await Promise.all(guilds.map(g => users.filter(u => bot.guilds.get(g.id).members.has(u.id)).map(u => Sync.updateMember(g, u))).reduce((acc, val) => acc.concat(val), []));

  }

}
