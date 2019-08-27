import { IUbiBound, ONLINE_TRACKER } from '@r6ru/types';
import { MessageOptions } from 'discord.js';
import { StatsBase } from 'r6api.js';

export default {
  rank: (bound: IUbiBound, stats: StatsBase): MessageOptions => ({
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
          value: `**В:** ${stats.general.wins || 0} **П:** ${stats.general.losses || 0}\n**В%:** ${(100 * (stats.general.wins / (stats.general.wins + stats.general.losses) || 0)).toFixed(2)}%`,
        },
        {
          inline: true,
          name: 'Убийства/Смерти',
          value: `**У:** ${stats.general.kills || 0} **С:** ${stats.general.deaths || 0}\n**У/С:** ${(stats.general.kills / (stats.general.deaths || 1)).toFixed(2)}`,
        },
      ],
      thumbnail: {
        url: `https://ubisoft-avatars.akamaized.net/${bound.genome}/default_146_146.png`,
      },
    },
  }),
};
