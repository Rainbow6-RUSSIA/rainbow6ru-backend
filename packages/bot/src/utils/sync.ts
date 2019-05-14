import { Guild as G, Team, User as U } from '@r6ru/db';
import { ONLINE_TRACKER, PLATFORM, VERIFICATION_LEVEL } from '@r6ru/types';
import { GuildMember, MessageAttachment } from 'discord.js';
import { $enum } from 'ts-enum-util';
import bot from '../bot';
import r6 from '../r6api';
import ENV from './env';
import { generate } from './qr';

export async function syncNicknames(platform: PLATFORM) {
  const UInsts = await U.findAll({
    limit: 40,
    order: [['nicknameUpdatedAt', 'ASC']],
    where: {platform: {
      [platform]: true,
    }},
  });
  // console.log(UInsts.map((u) => u.nickname).join(', '));
  if (!UInsts.length) { return []; }
  const res = await r6.api.getCurrentName(platform, UInsts.map((u) => u.genome));
  return Promise.all(UInsts.map((u) => {
    if (res[u.genome] && (u.nickname !== res[u.genome].name)) {
      console.log('[BOT]', u.nickname, '-->', res[u.genome].name);
      u.nickname = res[u.genome].name;
    }
    u.nicknameUpdatedAt = new Date();
    return u.save({ silent: true });
  }));
}

export async function syncRank(platform: PLATFORM) {
  const UInsts = await U.findAll({
    limit: parseInt(ENV.PACK_SIZE),
    order: [['rankUpdatedAt', 'ASC']],
    where: {
      inactive: false,
      platform: {[platform]: true}},
  });
  // console.log(UInsts.map((u) => u.nickname).join(', '));
  if (!UInsts.length) { return []; }
  const res = await r6.api.getRank(platform, UInsts.map((u) => u.genome));
  return Promise.all(UInsts.map((u) => {
    if (res[u.genome]) {
      u.rank = u.region ? res[u.genome][u.region].rank : Math.max(res[u.genome].apac.rank, res[u.genome].ncsa.rank, res[u.genome].emea.rank);
    }
    u.rankUpdatedAt = new Date();
    return u.save({ silent: true });
  }));
}

export async function sendQrRequest(dbGuild: G, dbUser: U, member: GuildMember) {
  dbUser.inactive = true;
  await dbUser.save();
  await (await bot.guilds.get(dbGuild.id).members.fetch(dbUser.id)).roles.remove([...dbGuild.rankRoles.filter(Boolean), ...Object.values(dbGuild.platformRoles).filter(Boolean)], 'запрос верификации');
  const QR = await generate(dbUser.genome, dbUser.id);
  await member.send(
    `Здравствуйте!\n\nДля дальнейшей игры вам необходимо подтвердить факт владения указанным аккаунтом Осады (${ONLINE_TRACKER}${dbUser.genome}) - вам нужно будет поставить прикрепленное изображение c QR-кодом на аватар **Uplay**.\nПосле смены аватара введите здесь команду \`${ENV.PREFIX}verify\`\nСменить аватар можно на https://account.ubisoft.com/ru-RU/account-information?modal=change-avatar`,
    new MessageAttachment(Buffer.from(QR.buffer), 'QR-verification.png'),
  );
  return false;
}

export async function sendFillingRequest(dbGuild: G, dbUser: U, member: GuildMember) {
  console.log('Filling request');
}

export async function syncMember(dbGuild: G, dbUser: U) {
    if (!dbGuild || !dbUser) { return false; }
    if (!dbGuild.premium) { return false; }
    const guild = bot.guilds.get(dbGuild.id);
    if (!guild.available) { return false; }

    let member: GuildMember = null;
    try {
      member = await guild.members.fetch(dbUser.id);
      if (!member) { throw new Error(); }
    } catch (err) {
      dbUser.inactive = true;
      await dbUser.save();
      return false;
    }

    if (dbUser.verificationLevel < dbGuild.requiredVerification || dbUser.verificationLevel < dbUser.requiredVerification) {
      return sendQrRequest(dbGuild, dbUser, member);
    }

    if (dbUser.syncNickname) {
      try {
        await member.setNickname(`${dbUser.teamId ? (await Team.findByPk(dbUser.teamId)).shortName + '.' : ''}${dbUser.nickname}${dbUser.verificationLevel >= VERIFICATION_LEVEL.QR ? ' ✔' : ''}`);
      } catch (err) {
        console.log(err);
      }
    }

    const currentRankRoles = member.roles.keyArray().filter((r) => dbGuild.rankRoles.includes(r));

    if (currentRankRoles.length > 1) {
      member = await member.roles.remove(dbGuild.rankRoles.filter(Boolean), 'удаляю роли перед обновлением...');
      if (dbGuild.rankRoles[dbUser.rank]) {
        member = await member.roles.add(dbGuild.rankRoles[dbUser.rank], '...готово');
      }
      console.log(`[BOT] User ${member.user.tag} updated!`);
    } else if (currentRankRoles.length === 1) {
      const currentRank = dbGuild.rankRoles.indexOf(currentRankRoles[0]);
      if ((dbUser.rank > currentRank || currentRank < dbGuild.fixAfter || dbUser.rank === 0) && currentRankRoles[0] !== dbGuild.rankRoles[dbUser.rank]) {
        member = await member.roles.set([...member.roles.array().map((r) => r.id), dbGuild.rankRoles[dbUser.rank]].filter((r) => r !== dbGuild.rankRoles[currentRank]), 'удаляю роли перед обновлением...готово');
        console.log(`[BOT] User ${member.user.tag} updated!`);
      }
    } else {
      if (dbGuild.rankRoles[dbUser.rank]) {
        member = await member.roles.add(dbGuild.rankRoles[dbUser.rank], 'пользователь обновлен');
        console.log(`[BOT] User ${member.user.tag} updated!`);
      }
    }

    const platformRolesToApply = Object.entries(dbGuild.platformRoles).filter((k) => dbUser.platform[k[0]]).map((k) => k[1]); // .filter((r) => !member.roles.has(r));
    // if (platformRolesToApply.length) {
    await Promise.all(platformRolesToApply.map((r) => member.roles.add(r, 'синхронизация платформы')));
    // }

    return true;
  }

export async function syncRoles() {
  const guilds = await G.findAll({where: {premium: true}});

  guilds.map((g) => console.log('[BOT] Syncing ' + bot.guilds.get(g.id).name));
  const usersAtPlatforms = await Promise.all($enum(PLATFORM).getValues().map((p) => syncRank(p)));
  const users = usersAtPlatforms.reduce((acc, val) => acc.concat(val), []);
  await Promise.all(guilds.map((g) => bot.guilds.get(g.id).members.fetch()));
  await Promise.all(guilds.map((g) => users.filter((u) => bot.guilds.get(g.id).members.has(u.id)).map((u) => syncMember(g, u))).reduce((acc, val) => acc.concat(val), []));
}
