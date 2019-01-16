import { EmojiResolvable, Message, MessageOptions, MessageReaction, ReactionEmoji, Snowflake, User, UserResolvable } from 'discord.js';
import { IStats, UUID } from 'r6api';
import bot from '../bot';
import { Guild as G} from '../models/Guild';
import { User as U } from '../models/User';
import r6api from '../r6api';
import { ENV, IUbiBound, ONLINE_TRACKER } from './types';

interface IPromptOptions {
    [prop: string]: any;
    lifetime?: number;
    aftertime?: number;
    emojis?: string[];
    messageOpt?: MessageOptions;
}

// class Utils {

// }

export async function combinedPrompt(prompt: Message, options: {
  emojis?: string[] | EmojiResolvable[],
  texts?: Array<string | string[]>,
  message: Message,
  time?: number,
  keep?: boolean,
}): Promise<number> {
  const { author } = options.message;
  const time = options.time || 5 * 60 * 1000;

  (async () => {
    for (const e of options.emojis) {
      await prompt.react(e);
    }
  })();

  const emojiFilter = (reaction: MessageReaction, user: User) => options.emojis.includes(reaction.emoji.id || reaction.emoji.name) && user.id === author.id;

  const textFilter = (msg: Message) => {
    const answ = msg.author.id === author.id &&
      options.texts.some(([...t]) =>
        t.some((txt) =>
          msg.content.toLowerCase().includes(txt),
        ));
    if (answ && !options.keep) {
      msg.delete();
    }
    return answ;
  };

  const race = await Promise.race([prompt.awaitReactions(emojiFilter, { max: 1, time }), prompt.channel.awaitMessages(textFilter, { max: 1, time })]);
  const result = race.first();
  if (!options.keep) {
    prompt.delete({timeout: 5000});
  }
  if (result instanceof Message) {
    return options.texts.findIndex(([...t]) =>
    t.some((txt) =>
      result.content.toLowerCase().includes(txt),
    ));
  } else if (result instanceof MessageReaction) {
    return options.emojis.indexOf(result.emoji.id || result.emoji.name);
  } else {
    return -1;
  }
}

export const embeds = {
  rank: function buildRankEmbed(bound: IUbiBound, s: IStats) {
    const stats = s.general;
    return {
        description: 'Общая статистика',
        url: `${ONLINE_TRACKER}${bound.genome}`,
        thumbnail: {
          url: `https://ubisoft-avatars.akamaized.net/${bound.genome}/default_146_146.png`,
        },
        author: {
          name: bound.nickname,
        },
        fields: [
          {
            name: 'Выигрыши/Поражения',
            value: `**В:** ${stats.won || 0} **П:** ${stats.lost || 0}\n**В%:** ${(100 * (stats.won / (stats.won + stats.lost) || 0)).toFixed(2)}%`,
            inline: true,
          },
          {
            name: 'Убийства/Смерти',
            value: `**У:** ${stats.kills || 0} **С:** ${stats.deaths || 0}\n**У/С:** ${(stats.kills / (stats.deaths || 1)).toFixed(2)}`,
            inline: true,
          },
        ],
      };
  },

};

export async function syncRank() {
  const UInsts = await U.findAll({
    where: {inactive: false},
    limit: parseInt(ENV.PACK_SIZE),
    order: ['updatedAt', 'ASC'],
  });

}

export async function syncMember(dbGuild: G, dbUser: U, currentRoles?: string[]) {
    const guild = bot.guilds.get(dbGuild.id);
    const member = guild.members.get(dbUser.id);
    if (!guild.available) { return; }
    if (!currentRoles) {
      currentRoles = member.roles.keyArray();
    }

    const rolesToApply = [];

    for (const key in dbUser.platform) {
      if (dbUser.platform[key]) { rolesToApply.push(dbGuild.platformRoles[key]); }
    }

    rolesToApply.push(dbGuild.rankRoles[dbUser.rank]);

    member.edit({roles: rolesToApply});
}
