import { IUbiBound, ONLINE_TRACKER } from '@r6ru/types';

export default {
    rank: function buildRankEmbed(bound: IUbiBound, stats: {won?: any, lost?: any, kills?: any, deaths?: any}) {
      return {
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
      };
    },
  };
