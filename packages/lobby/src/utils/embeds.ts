import { currentlyPlaying, EMOJI_REGEXP, EmojiButtons, HF_PLATFORM, IngameStatus as IS, RANK_BADGES, RANK_COLORS, RANKS, VERIFICATION_LEVEL, VERIFIED_BADGE } from '@r6ru/types';
import { GuildMember, MessageEmbed, MessageOptions, Util } from 'discord.js';
import bot from '../bot';
import ENV from './env';
import { LobbyStore } from './lobby';
import { LSRoom } from './lobby/room';
import { extractBorders } from './preview';

export default {
  appealMsg: (lobby: LSRoom): MessageOptions => {
    const embed = new MessageEmbed()
    .setAuthor(modeSelector(lobby), lobby.dcLeader.user.displayAvatarURL())
    .setColor(RANK_COLORS[lobby.leader?.rank || 0])
    .setDescription(
      (lobby.members
        .sort((a, b) => b.rank - a.rank)
        .map(m => (lobby.dcLeader.id === m.id ? '\\👑 ' : '')
            + (!m.platform.PC ? '\\🎮' : '')
            + `<@${m.id}> (${bot.emojis.resolve(RANK_BADGES[m.rank])} **${Util.escapeMarkdown(m.nickname)}** - [${HF_PLATFORM[Object.entries(m.platform).find(e => e[1])[0]]}](${m.toString()})${(' | ' + m.region).replace(/.+emea/g, '').replace('ncsa', '🌎').replace('apac', '🌏')})`
            + ((m.verificationLevel >= VERIFICATION_LEVEL.QR) ? ` ${bot.emojis.resolve(VERIFIED_BADGE)}` : ''))
        .join('\n')
      )
      + (lobby.description ? `\n▫${lobby.description}` : '')
    )
    .setFooter(`В игре ники Uplay отличаются? Cообщите администрации со скрином таба. С вами ненадежный игрок! • S: ${IS[lobby.status]} ID: ${lobby.id}`, 'https://i.imgur.com/sDOEWMV.png')
    .setThumbnail(`${ENV.LOBBY_PREVIEW_URL}/${lobby.id}/preview?a${lobby.minRank}.${lobby.maxRank}.${lobby.dcChannel.userLimit - lobby.dcMembers.size}=1`)
    .setTimestamp();

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
      embed.addField('Присоединиться:', `${lobby.dcInvite.url} 👈`);
    } else if (!lobby.close && (lobby.dcMembers.size < lobby.dcChannel.userLimit) && currentlyPlaying.includes(lobby.status)) {
      embed.addField('Лобби играет', `Сейчас лучше не заходить в комнату, чтобы не беспокоить игроков.`);
    }

    return { embed };
  },

  fastAppeal: async (LS: LobbyStore): Promise<MessageOptions> => {
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
          modeSelector(lobby).replace(EMOJI_REGEXP, v => '\\' + v),
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
  },

  appealMsgPremium: (member: GuildMember, description: string, invite: string): MessageOptions => ({
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
};

const modeSelector = (lobby: LSRoom) => {
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
