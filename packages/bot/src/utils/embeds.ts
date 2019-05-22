import { Lobby } from '@r6ru/db';
import { IngameStatus as IS, IUbiBound, ONLINE_TRACKER, RANK_COLORS, VERIFICATION_LEVEL } from '@r6ru/types';
import { MessageAttachment, MessageOptions } from 'discord.js';
import ENV from './env';
import { createLobbyPreview } from './preview';

export default {
  appealMsg: async (lobby: Lobby): Promise<MessageOptions> => ({
    embed: {
      author: {
          iconURL: `${lobby.dcLeader.user.displayAvatarURL()}`,
          name: ((_) => {
            const slot = lobby.dcChannel.members.size < lobby.dcChannel.userLimit
              ? ` | +${lobby.dcChannel.userLimit - lobby.dcChannel.members.size} слот(-а)`
              : '';
            switch (_) {
              case IS.CASUAL_SEARCH:
              case IS.RANKED_SEARCH:
              case IS.CUSTOM_SEARCH:
                return `Поиск матча в ${lobby.dcChannel.name}` + slot;
              case IS.CASUAL:
              case IS.RANKED:
              case IS.CUSTOM:
                return `Играют в ${lobby.dcChannel.name}`;
              case IS.TERRORIST_HUNT:
                return `${lobby.dcChannel.name} разминается в Антитерроре` + slot;
              case IS.OTHER:
              case IS.MENU:
              default:
                return lobby.dcChannel.members.size >= lobby.dcChannel.userLimit
                  ? `Готовы играть в ${lobby.dcChannel.name}`
                  : `Ищут +${lobby.dcChannel.userLimit - lobby.dcChannel.members.size} в ${lobby.dcChannel.name}`;
            }
          })(lobby.status),
      },
      color: RANK_COLORS[lobby.members.find((m) => m.id === lobby.dcLeader.id).rank],
      description: (lobby.members.map((m) => `<@${m.id}> (Uplay - [**${m.nickname}**](${ONLINE_TRACKER}${m.genome})) ${m.verificationLevel >= VERIFICATION_LEVEL.QR ? ENV.VERIFIED_BADGE : ''}`).join('\n'))
        + (lobby.description
          ? `\n▫${lobby.description}`
          : '')
        + (![IS.CASUAL, IS.RANKED, IS.CUSTOM].includes(lobby.status) && lobby.dcChannel.members.size < lobby.dcChannel.userLimit
          ? `\nПрисоединиться: ${lobby.dcInvite.url} 👈`
          : ''),
      fields: [],
      footer: {
          iconURL: 'https://i.imgur.com/sDOEWMV.png',
          text: `В игре ники участников отличаются от вышеуказанных? Cообщите администрации.\nС вами игрок с плохой репутацией!${ENV.NODE_ENV === 'development' ? ` | ID: ${lobby.id}` : ''}`,
      },
      thumbnail: {
          url: `https://bot.rainbow6russia.ru/lobby/${lobby.id}/preview?${Math.random().toString(36).substring(2, 6)}=1`,
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
};
