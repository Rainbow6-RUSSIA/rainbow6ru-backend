import { Lobby, User } from '@r6ru/db';
import { IngameStatus as IS, IUbiBound, ONLINE_TRACKER, RANK_COLORS, VERIFICATION_LEVEL } from '@r6ru/types';
import { GuildMember, MessageOptions } from 'discord.js';
import ENV from './env';

export default {
  appealMsg: async (lobby: Lobby): Promise<MessageOptions> => ({
    embed: {
      author: {
          iconURL: lobby.dcLeader.user.displayAvatarURL(),
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
          url: ![IS.CASUAL, IS.RANKED, IS.CUSTOM].includes(lobby.status) && lobby.dcChannel.members.size < lobby.dcChannel.userLimit ? lobby.dcInvite.url : '',
      },
      color: RANK_COLORS[(lobby.members.find((m) => m.id === lobby.dcLeader.id) || await User.findByPk(lobby.dcLeader.id)).rank],
      description: (lobby.members.sort((a, b) => b.rank - a.rank).map((m) => `<@${m.id}> (\`${m.nickname}\` - [uplay](${ONLINE_TRACKER}${m.genome})) ${m.verificationLevel >= VERIFICATION_LEVEL.QR ? ENV.VERIFIED_BADGE : ''}`).join('\n'))
        + (lobby.description
          ? `\n▫${lobby.description}`
          : ''),
      fields: (![IS.CASUAL, IS.RANKED, IS.CUSTOM].includes(lobby.status) && lobby.dcChannel.members.size < lobby.dcChannel.userLimit
      ? [{
        name: 'Присоединиться',
        value: `${lobby.dcInvite.url} 👈`,
      }]
      : undefined),
      footer: {
          iconURL: 'https://i.imgur.com/sDOEWMV.png',
          text: `В игре ники Uplay отличаются? Cообщите администрации.\nС вами ненадежный игрок! | ID: ${lobby.id}`,
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

  appealMsgPremium: (member: GuildMember, description: string, invite: string): MessageOptions => ({
    embed: {
      author: {
        iconURL: member.user.displayAvatarURL(),
        name: `${member.user.tag} ищет +${member.voice.channel.userLimit - member.voice.channel.members.size} в свою уютную комнату | ${member.voice.channel.name}`,
      },
      color: 12458289,
      fields: [
        {
          name: '❤❤❤',
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
