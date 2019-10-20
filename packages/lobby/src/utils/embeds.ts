import { currentlyPlaying, EMOJI_REGEXP, EmojiButtons, IngameStatus as IS, ONLINE_TRACKER, RANK_BADGES, RANK_COLORS, RANKS, VERIFICATION_LEVEL } from '@r6ru/types';
import { EmbedField, GuildMember, MessageOptions, Util } from 'discord.js';
import bot from '../bot';
import ENV from './env';
import { LobbyStore } from './lobby';
import { LSRoom } from './lobby/room';

export default {
  appealMsg: (lobby: LSRoom): MessageOptions => ({
    embed: {
      author: {
          iconURL: lobby.dcLeader.user.displayAvatarURL(),
          name: modeSelector(lobby),
      },
      color: RANK_COLORS[(lobby.leader && lobby.leader.rank) || 0],
      description:
        (lobby.members
          .sort((a, b) => b.rank - a.rank)
          .map(m => (lobby.dcLeader.id === m.id ? '\\👑 ' : '')
              + (!m.platform.PC ? '\\🎮' : '')
              + `<@${m.id}> (${bot.emojis.resolve(RANK_BADGES[m.rank])} **${Util.escapeMarkdown(m.nickname)}** - [${Object.entries(m.platform).find(e => e[1])[0].replace('PC', 'Uplay').replace('PS4', 'PSN').replace('XBOX', 'Xbox LIVE')}](${ONLINE_TRACKER}${m.genome})${(' | ' + m.region).replace(/.+emea/g, '').replace('ncsa', '🌎').replace('apac', '🌏')})`
              + ((m.verificationLevel >= VERIFICATION_LEVEL.QR) ? ' ' + ENV.VERIFIED_BADGE : ''))
          .join('\n'))
        + (lobby.description
          ? `\n▫${lobby.description}`
          : ''),
      fields: (() => {
        const fields: EmbedField[] = [];
        if (lobby.hardplay) {
          fields.push({
            name: `Режим "HardPlay\\${EmojiButtons.HARDPLAY}"`,
            value: `Минимальный ранг для входа: \`${RANKS[lobby.guild.rankRoles.findIndex(r => lobby.guild.rankRoles[lobby.minRank] === r)]}\``,
          });
        }
        if (lobby.close) {
          fields.push({
            name: 'Закрытое лобби',
            value: 'Лимит пользователей восстановится при выходе кого-либо из лобби.',
          });
        }
        if ([IS.NEWCOMER, IS.NEWCOMER_SEARCH].includes(lobby.status)) {
          fields.push({
            name: 'Режим "Новичок"',
            value: 'Опытным игрокам лучше найти другую комнату, чтобы избежать конфликтов и поражений.',
          });
        }
        if (lobby.joinAllowed) {
          fields.push({
            name: 'Присоединиться:',
            value: `${lobby.dcInvite.url} 👈`,
          });
        } else if (!lobby.close && (lobby.dcMembers.size < lobby.dcChannel.userLimit) && currentlyPlaying.includes(lobby.status)) {
          fields.push({
            name: 'Лобби играет',
            value: `Сейчас лучше не заходить в комнату, чтобы не беспокоить игроков.`,
          });
        }
        return fields;
      })(),
      footer: {
          iconURL: 'https://i.imgur.com/sDOEWMV.png',
          text: `В игре ники Uplay отличаются? Cообщите администрации со скрином таба. С вами ненадежный игрок! • S: ${IS[lobby.status]} ID: ${lobby.id}`,
      },
      thumbnail: {
          url: `${ENV.LOBBY_PREVIEW_URL}/${lobby.id}/preview?a${lobby.minRank}.${lobby.maxRank}.${lobby.dcChannel.userLimit - lobby.dcMembers.size}=1`,
      },
      timestamp: new Date(),
    },
  }),

  fastAppeal: async (LS: LobbyStore): Promise<MessageOptions> => ({
    embed: {
      author: {
        iconURL: LS.lfgChannel.guild.iconURL(),
        name: `Быстрый поиск команды в ${LS.category.name}`,
      },
      description: `Канал поиска: ${LS.lfgChannel}\n`
        + `Всего лобби: \`${LS.rooms.filter(v => Boolean(v.dcMembers.size)).size}\`\n`
        + `Ищут игрока: \`${LS.rooms
            .filter(l => Boolean(l.dcMembers.size) && l.appealMessage && l.joinAllowed)
            .size
          || (LS.rooms
            .filter(l => Boolean(l.dcMembers.size) && Boolean(l.appealMessage))
            .size
              ? 'все комнаты укомплектованы!'
              : 0)}\`\n`
        + `Присоединиться к новой комнате: ${await (LS.rooms.filter(r => !r.dcMembers.size).last() || LS.rooms.last()).initInvite()} 👈`,
      fields: LS.rooms
        .filter(l => Boolean(l.dcMembers.size) && l.appealMessage && l.joinAllowed)
        .sort((a, b) => a.dcChannel.position - b.dcChannel.position)
        .array()
        .slice(0, 24)
        .map(lobby => ({
          inline: true,
          name: modeSelector(lobby)
            .replace(EMOJI_REGEXP, v => '\\' + v), // emoji wrap
          value: (lobby.hardplay
              ? `HardPlay\\${EmojiButtons.HARDPLAY}: только \`${RANKS[lobby.guild.rankRoles.findIndex(r => lobby.guild.rankRoles[lobby.minRank] === r)]}\` и выше\n`
              : `Ранг: ${lobby.minRank === lobby.maxRank
                ? (lobby.maxRank === 0
                  ? '`любой`'
                  : (() => {
                   let n = lobby.minRank;
                   n--;
                   n = n - n % 4 + 1;
                   return `от \`${RANKS[n]}\` до \`${RANKS[n + 3]}\``;
                  })())
                : `от \`${RANKS[lobby.minRank]}\` до \`${RANKS[lobby.maxRank]}\``}\n`)
            + ([IS.NEWCOMER, IS.NEWCOMER_SEARCH].includes(lobby.status) ? 'Новичок: не выше `50` уровня доступа\n' : '')
            + (lobby.description ? `Описание: ${lobby.description}\n` : '')
            // + `Присоединиться: ${lobby.dcInvite.url} 👈\n`
            + `[подробнее...](${lobby.appealMessage.url})`,
        })),
      footer: {
        text: `ID - ${LS.settings.type}`,
      },
      timestamp: null,
    },
  }),

  appealMsgPremium: (member: GuildMember, description: string, invite: string): MessageOptions => ({
    embed: {
      author: {
        iconURL: member.user.displayAvatarURL(),
        name: `${member.user.tag} ищет +${member.voice.channel.userLimit - member.voice.channel.members.size} в свою уютную комнату | ${member.voice.channel.name}`,
      },
      color: 12458289,
      fields: [
        {
          name: '🇷6⃣🇷🇺',
          value: description || ' ឵឵ ឵឵',
        },
        {
          name: 'Присоединиться',
          value: `${invite} 👈`,
        },
      ],
      footer: {
        iconURL: 'https://cdn.discordapp.com/emojis/414787874374942721.png?v=1',
        text: `Хотите так же? Обратитесь в ЛС Сервера или к ${member.guild.owner.user.tag} с рублями из маминого кошелька <:oooohmyyy:585721245941891073>, или активируйте Nitro Boost.`,
      },
      thumbnail: {
        url: member.user.displayAvatarURL(),
      },
      timestamp: new Date(),
    },
  }),
};

const modeSelector = (lobby: LSRoom) => {
  const slot = lobby.joinAllowed
    ? ` | +${lobby.dcChannel.userLimit - lobby.dcMembers.size} слот(-а)`
    : '';
  switch (lobby.status) {
    case IS.CASUAL_SEARCH:
    case IS.RANKED_SEARCH:
    case IS.CUSTOM_SEARCH:
      return `Поиск матча в ${lobby.dcChannel.name}` + slot;
    case IS.DISCOVERY_SEARCH:
      return `Поиск Разведки в ${lobby.dcChannel.name}` + slot;
    case IS.NEWCOMER_SEARCH:
      return `Поиск режима Новичок в ${lobby.dcChannel.name}` + slot;
    case IS.CASUAL:
    case IS.RANKED:
    case IS.CUSTOM:
      return `Играют в ${lobby.dcChannel.name}`;
    case IS.NEWCOMER:
      return `Играют режим Новичок в ${lobby.dcChannel.name}`;
    case IS.TERRORIST_HUNT:
      return `${lobby.dcChannel.name} разминается в Антитерроре` + slot;
    case IS.DISCOVERY:
      return `${lobby.dcChannel.name} играет Разведку` + slot;
    case IS.OTHER:
    case IS.MENU:
    default:
      return lobby.close || lobby.dcMembers.size >= lobby.dcChannel.userLimit
        ? `Готовы играть в ${lobby.dcChannel.name}`
        : `Ищут +${lobby.dcChannel.userLimit - lobby.dcMembers.size} в ${lobby.dcChannel.name}`;
  }
};
