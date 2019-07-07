import { Lobby, User } from '@r6ru/db';
import { IngameStatus as IS, IUbiBound, ONLINE_TRACKER, RANK_COLORS, RANKS, VERIFICATION_LEVEL } from '@r6ru/types';
import { EmbedField, GuildMember, MessageOptions } from 'discord.js';
import ENV from './env';

const currentlyPlaying = [IS.CASUAL, IS.RANKED, IS.CUSTOM, IS.NEWCOMER, IS.DISCOVERY];

export default {
  appealMsg: async (lobby: Lobby): Promise<MessageOptions> => ({
    embed: {
      author: {
          iconURL: lobby.dcLeader.user.displayAvatarURL(),
          name: ((_) => {
            const slot = lobby.open && lobby.dcChannel.members.size < lobby.dcChannel.userLimit
              ? ` | +${lobby.dcChannel.userLimit - lobby.dcChannel.members.size} слот(-а)`
              : '';
            switch (_) {
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
                return !lobby.open || lobby.dcChannel.members.size >= lobby.dcChannel.userLimit
                  ? `Готовы играть в ${lobby.dcChannel.name}`
                  : `Ищут +${lobby.dcChannel.userLimit - lobby.dcChannel.members.size} в ${lobby.dcChannel.name}`;
            }
          })(lobby.status),
      },
      color: await (async () => {
        const dbUser = (lobby.members.find((m) => m.id === lobby.dcLeader.id) || await User.findByPk(lobby.dcLeader.id));
        return RANK_COLORS[(dbUser && dbUser.rank) || 0];
      })(),
      description:
        (lobby.members
          .sort((a, b) => b.rank - a.rank)
          .map((m) => (lobby.dcLeader.id === m.id ? '\\👑 ' : '')
              + (!m.platform.PC ? '\\🎮' : '')
              + `<@${m.id}> (\`${m.nickname}\` - [${Object.entries(m.platform).find((e) => e[1])[0].replace('PC', 'Uplay').replace('PS4', 'PSN').replace('XBOX', 'Xbox LIVE')}](${ONLINE_TRACKER}${m.genome})${(' | ' + m.region).replace(/.+emea/g, '').replace('ncsa', '🌎').replace('apac', '🌏')})`
              + ((m.verificationLevel >= VERIFICATION_LEVEL.QR) ? ' ' + ENV.VERIFIED_BADGE : ''))
          .join('\n'))
        + (lobby.description
          ? `\n▫${lobby.description}`
          : ''),
      fields: (() => {
        const fields: EmbedField[] = [];
        if (lobby.hardplay) {
          fields.push({
            name: 'Режим "HardPlay"',
            value: `Минимальный ранг для входа: \`${RANKS[lobby.guild.rankRoles.findIndex((r) => lobby.guild.rankRoles[lobby.minRank] === r)]}\``,
          });
        }
        if (!lobby.open) {
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
        if (lobby.open && (lobby.dcChannel.members.size < lobby.dcChannel.userLimit) && !currentlyPlaying.includes(lobby.status)) {
          fields.push({
            name: 'Присоединиться',
            value: `${lobby.dcInvite.url} 👈`,
          });
        } else if (lobby.open && (lobby.dcChannel.members.size < lobby.dcChannel.userLimit) && currentlyPlaying.includes(lobby.status)) {
          fields.push({
            name: 'Лобби играет',
            value: `Сейчас лучше не заходить в комнату, чтобы не беспокоить игроков.`,
          });
        }
        return fields;
      })(),
      footer: {
          iconURL: 'https://i.imgur.com/sDOEWMV.png',
          text: `В игре ники Uplay отличаются? Cообщите администрации со скрином таба. С вами ненадежный игрок! ID: ${lobby.id}`,
      },
      thumbnail: {
          url: `${ENV.LOBBY_PREVIEW_URL}/${lobby.id}/preview?a${lobby.minRank}.${lobby.maxRank}.${lobby.dcChannel.userLimit - lobby.dcChannel.members.size}=1`,
      },
      timestamp: new Date(),
    },
  }),

  rank: (bound: IUbiBound, stats: {won?: any, lost?: any, kills?: any, deaths?: any}): MessageOptions => ({
    embed: {
      author: {
        name: bound.nickname,
        url: `${ONLINE_TRACKER}${bound.genome}`,
      },
      description: `Общая статистика на платформе \`${bound.platform}\``,
      fields: [
        {
          inline: true,
          name: 'Выигрыши/Поражения',
          value: `**В:** ${stats.won || 0} **П:** ${stats.lost || 0}\n**В%:** ${(100 * (stats.won / (stats.won + stats.lost) || 0)).toFixed(2)}%`,
        },
        {
          inline: true,
          name: 'Убийства/Смерти',
          value: `**У:** ${stats.kills || 0} **С:** ${stats.deaths || 0}\n**У/С:** ${(stats.kills / (stats.deaths || 1)).toFixed(2)}`,
        },
      ],
      thumbnail: {
        url: `https://ubisoft-avatars.akamaized.net/${bound.genome}/default_146_146.png`,
      },
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
        text: `Хотите так же? Обратитесь в ЛС Сервера, к ${member.guild.members.filter((m) => !m.user.bot && m.hasPermission('MANAGE_GUILD')).map((m) => m.user.tag).join(', ')} или активируйте Nitro Boost`,
      },
      thumbnail: {
        url: member.user.displayAvatarURL(),
      },
      timestamp: new Date(),
    },
  }),
};
