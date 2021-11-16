import { Lobby, User } from '@r6ru/db';
import { currentlyPlaying, EMOJI_REGEXP, EmojiButtons, HF_PLATFORM, IngameStatus as IS, RANK_BADGES, RANK_COLORS, RANKS, VERIFICATION_LEVEL, VERIFIED_BADGE, DONATE_BADGE, NITRO_BADGE, ADMIN_BADGE, RankGaps } from '@r6ru/types';
import { MessageAttachment } from 'discord.js';
import { GuildChannel } from 'discord.js';
import { GuildMember, MessageEmbed, MessageOptions, Util } from 'discord.js';
import bot from '../bot';
import ENV from './env';
import { LobbyStore } from './lobby';
import { LSRoom } from './lobby/room';
import { createEnhancedUserPreview, extractBorders, canQueue, rankedGap } from './preview';

const gitInfo = require('git-commit-info');
const versionHash = gitInfo().shortHash;

const memberTag = (lobby: LSRoom, user: User, member = lobby.dcGuild.members.get(user.id)) =>
  (lobby.dcLeader.id === user.id ? '\\👑 ' : '')
  + (!user.platform.PC ? '\\🎮' : '')
  + `<@${user.id}> (${bot.emojis.resolve(RANK_BADGES[user.rank])} **${Util.escapeMarkdown(user.nickname)}** - [${HF_PLATFORM[Object.entries(user.platform).find(e => e[1])[0]]}](${user.toString()})${(' | ' + user.region).replace(/.+emea/g, '').replace('ncsa', '🌎').replace('apac', '🌏')})`
  + ' '
  + (user.verificationLevel >= VERIFICATION_LEVEL.QR ? bot.emojis.resolve(VERIFIED_BADGE).toString() : '')
  + (member.roles.has(ENV.DONATE_ROLE) ? bot.emojis.resolve(DONATE_BADGE).toString() : '')
  + (member.roles.has(ENV.NITRO_ROLE) ? bot.emojis.resolve(NITRO_BADGE).toString() : '')
  + (member.permissions.has('MANAGE_ROLES') ? bot.emojis.resolve(ADMIN_BADGE).toString() : '')

export default class LobbyEmbedUtil {
  static addFields = (lobby: LSRoom, embed: MessageEmbed) => {
    if (lobby.hardplay) {
      embed.addField(`Режим "HardPlay\\${EmojiButtons.HARDPLAY}"`, `Минимальный ранг для входа: \`${RANKS[lobby.guild.rankRoles.findIndex(r => lobby.guild.rankRoles[lobby.minRank] === r)]}\``);
    }

    if (lobby.close) {
      embed.addField('Закрытое лобби', 'Лимит пользователей восстановится при выходе кого-либо из лобби.');
    }

    if ([IS.NEWCOMER, IS.NEWCOMER_SEARCH].includes(lobby.status)) {
      embed.addField('Режим "Новичок"', 'Опытным игрокам лучше найти другую комнату, чтобы избежать конфликтов и поражений.');
    }

    if (lobby.joinAllowed) {
      embed.addField('Присоединиться:', `<#${lobby.channel}> 👈`);
    } else if (!lobby.close && (lobby.dcMembers.size < lobby.dcChannel.userLimit) && currentlyPlaying.includes(lobby.status)) {
      embed.addField('Лобби играет', `Сейчас лучше не заходить в комнату, чтобы не беспокоить игроков.`);
    }

    return embed
  }

  static appealMsg = (lobby: LSRoom): MessageOptions => {
    const k = lobby.joinAllowed
      ? lobby.dcChannel.userLimit - lobby.dcMembers.size
      : 0

    let embed = new MessageEmbed()
      .setAuthor(LobbyEmbedUtil.modeSelector(lobby), lobby.dcLeader.user.displayAvatarURL())
      .setColor(RANK_COLORS[lobby.leader?.rank || 0])
      .setDescription(
        (lobby.members
          .sort((a, b) => b.rank - a.rank)
          .map(m => memberTag(lobby, m))
          .join('\n')
        )
        + (lobby.description ? `\n▫${Util.escapeMarkdown(lobby.description)}` : '')
        + (lobby.type === "ranked" && !canQueue([lobby.minRank, lobby.maxRank]) ? `\n**Разброс MMR в лобби слишком велик (>${rankedGap})**` : "")
      )
      .setFooter(`В игре ники Uplay отличаются? Cообщите администрации со скрином таба. С вами ненадежный игрок! • S: ${IS[lobby.status]} ID: ${lobby.id}`, 'https://i.imgur.com/sDOEWMV.png')
      .setThumbnail(`${ENV.LOBBY_SERVICE_URL}/v${versionHash}/lobby/${lobby.minRank}/${lobby.maxRank}/${k}/preview.png`)
      .setTimestamp();

    embed = LobbyEmbedUtil.addFields(lobby, embed)

    return { embed };
  }

  static appealMsgEnhanced = (lobby: LSRoom): MessageOptions => {
    let description = memberTag(lobby, lobby.leader) + '\n'
    if (lobby.members.length > 1) description += '──────────────────────\n'
    description += lobby.members
      .filter(u => u.id !== lobby.leader.id)
      .sort((a, b) => b.rank - a.rank)
      .map(u => memberTag(lobby, u))
      .join('\n')
    description += '\`\`\`\nʀᴀɪɴʙᴏᴡ6-ʀᴜssɪᴀ ᴘʀᴇᴍɪᴜᴍ ʟᴏʙʙʏ               — □ ×\n\`\`\`'
    description += (lobby.description ?? '') + (lobby.type === "ranked" && !canQueue([lobby.minRank, lobby.maxRank]) ? "\n**Разброс MMR в лобби слишком велик (>700)**" : "")

    let embed = new MessageEmbed()
      .setAuthor(LobbyEmbedUtil.modeSelector(lobby), lobby.dcLeader.user.displayAvatarURL())
      .setColor([118, 31, 230])
      .setDescription(description)
      .setFooter(`Хочешь так же? Смотри #${(bot.channels.get('559714938000769034') as GuildChannel).name} • S: ${IS[lobby.status]} ID: ${lobby.id}`, 'https://cdn.discordapp.com/emojis/414787874374942721.png?v=1')
      .setThumbnail(`${ENV.LOBBY_SERVICE_URL}/v${versionHash}/leader/${lobby.dcLeader.id}/${lobby.dcLeader.user.avatar}/preview.gif`)
      .setTimestamp();

    embed = LobbyEmbedUtil.addFields(lobby, embed)

    return { embed }
  }

  static fastAppeal = async (LS: LobbyStore): Promise<MessageOptions> => {
    // console.log(LS.rooms.filter(l => !l.dcMembers.size).map(r => r.dcChannel.name));
    const embed = new MessageEmbed()
      .setAuthor(`Быстрый поиск команды в ${LS.category.name}`, LS.lfgChannel.guild.iconURL())
      .setFooter(`ID - ${LS.settings.type}`)
      .setDescription(`Канал поиска: ${LS.lfgChannel}\n`
        + `Всего лобби: \`${LS.rooms.filter(v => Boolean(v.dcMembers.size)).size}\`\n`
        + `Ищут игрока: \`${LS.rooms
          .filter(l => Boolean(l.dcMembers.size) && l.appealMessage && l.joinAllowed)
          .size
        || (LS.rooms
          .filter(l => Boolean(l.dcMembers.size) && Boolean(l.appealMessage))
          .size
          ? 'все комнаты укомплектованы!'
          : 0)}\`\n`
        + `Присоединиться к новой комнате: ${await (LS.rooms.filter(r => !r.dcMembers.size).last() || LS.rooms.last()).initInvite()} 👈`
      );
    LS.rooms
      .filter(l => Boolean(l.dcMembers.size) && l.appealMessage && l.joinAllowed)
      .sort((a, b) => a.dcChannel.position - b.dcChannel.position)
      .array()
      .slice(0, 24)
      .map(lobby =>
        embed.addField(
          LobbyEmbedUtil.modeSelector(lobby).replace(EMOJI_REGEXP, v => '\\' + v),
          (lobby.hardplay
            ? `HardPlay\\${EmojiButtons.HARDPLAY}: только \`${RANKS[lobby.guild.rankRoles.findIndex(r => lobby.guild.rankRoles[lobby.minRank] === r)]}\` и выше\n`
            : `Ранг: ${lobby.minRank === lobby.maxRank
              ? (lobby.maxRank === 0
                ? '`любой`'
                : `от \`${RANKS[extractBorders([lobby.minRank, lobby.maxRank])[0]]}\`${bot.emojis.resolve(RANK_BADGES[extractBorders([lobby.minRank, lobby.maxRank])[0]])} до \`${RANKS[extractBorders([lobby.minRank, lobby.maxRank])[1]]}\`${bot.emojis.resolve(RANK_BADGES[extractBorders([lobby.minRank, lobby.maxRank])[1]])}`)
              : `от \`${RANKS[lobby.minRank]}\`${bot.emojis.resolve(RANK_BADGES[lobby.minRank])} до \`${RANKS[lobby.maxRank]}\`${bot.emojis.resolve(RANK_BADGES[lobby.maxRank])}`}\n`)
          + ([IS.NEWCOMER, IS.NEWCOMER_SEARCH].includes(lobby.status) ? 'Новичок: не выше `50` уровня доступа\n' : '')
          + (lobby.description ? `Описание: ${lobby.description}\n` : '')
          // + `Присоединиться: ${lobby.dcInvite.url} 👈\n`
          + `[подробнее...](${lobby.appealMessage.url})\n`
          + `ㅤ`
        )
      );
    return { embed };
  }

  static appealMsgPremium = (member: GuildMember, description: string, invite: string): MessageOptions => ({
    embed: new MessageEmbed()
      .setAuthor(
        `${member.user.tag} ищет +${member.voice.channel.userLimit - member.voice.channel.members.size} в свою уютную комнату | ${member.voice.channel.name}`,
        member.user.displayAvatarURL()
      ).setColor(12458289)
      .addField('🇷6⃣🇷🇺', description || ' ឵឵ ឵឵')
      .addField('Присоединиться', `${invite} 👈`)
      .setFooter(`Хотите так же? Обратитесь в ЛС Сервера или к ${member.guild.owner.user.tag} с рублями из маминого кошелька 💵, или активируйте Nitro Boost 💜.`, 'https://cdn.discordapp.com/emojis/414787874374942721.png?v=1')
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp()
  })

  static modeSelector = (lobby: LSRoom) => {
    const slot = lobby.joinAllowed
      ? ` | +${lobby.dcChannel.userLimit - lobby.dcMembers.size} слот(-а)`
      : '';
    switch (lobby.status) {
      case IS.CASUAL_SEARCH:
      case IS.RANKED_SEARCH:
      case IS.UNRANKED_SEARCH:
        return `Поиск матча в ${lobby.dcChannel.name}` + slot;
      case IS.CUSTOM_SEARCH:
        return `Поиск Пользовательской в ${lobby.dcChannel.name}` + slot;
      case IS.DISCOVERY_SEARCH:
        return `Поиск Разведки в ${lobby.dcChannel.name}` + slot;
      case IS.NEWCOMER_SEARCH:
        return `Поиск режима Новичок в ${lobby.dcChannel.name}` + slot;
      case IS.CASUAL:
      case IS.RANKED:
      case IS.CUSTOM:
      case IS.UNRANKED:
        return `Играют в ${lobby.dcChannel.name}`;
      case IS.DISCOVERY:
        return `${lobby.dcChannel.name} играет Разведку` + slot;
      case IS.NEWCOMER:
        return `Играют режим Новичок в ${lobby.dcChannel.name}`;
      case IS.TERRORIST_HUNT:
        return `${lobby.dcChannel.name} разминается в Антитерроре` + slot;
      case IS.OTHER:
      case IS.MENU:
      default:
        return lobby.close || lobby.dcMembers.size >= lobby.dcChannel.userLimit
          ? `Готовы играть в ${lobby.dcChannel.name}`
          : `Ищут +${lobby.dcChannel.userLimit - lobby.dcMembers.size} в ${lobby.dcChannel.name}`;
    }
  };
}

