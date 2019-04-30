import { ClientUser, EmojiResolvable, Message, MessageOptions, MessageReaction, User, WebhookClient } from 'discord.js';

interface IPromptOptions {
    [prop: string]: any;
    lifetime?: number;
    aftertime?: number;
    emojis?: string[];
    messageOpt?: MessageOptions;
}

export enum MATCH_TYPE {
  BO1 = 'bo1',
  BO2 = 'bo2',
  BO3 = 'bo3',
  BO5 = 'bo5',
  BO7 = 'bo7',
}

export function emojiNumbers(n: number) {
  return ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'].slice(0, n);
}

export async function combinedPrompt(prompt: Message, options: {
  emojis?: string[] | EmojiResolvable[],
  texts?: Array<string | string[]>,
  author: User,
  time?: number,
  keep?: boolean,
}): Promise<number> {
  const { author } = options;
  const time = options.time || 5 * 60 * 1000;
  options.emojis = options.emojis || [];
  options.texts = options.texts || [];

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
  const result = race.first() as any;
  if (!options.keep) {
    prompt.delete({timeout: 5000});
  }
  // console.log({result}, result instanceof Message, result instanceof MessageReaction)
  if (result && result.channel) {
    return options.texts.findIndex(([...t]) =>
    t.some((txt) =>
      result.content.toLowerCase().includes(txt),
    ));
  } else if (result && result.message) {
    return options.emojis.indexOf(result.emoji.id || result.emoji.name);
  } else {
    return -1;
  }
}

type Context = 'BOT' | 'STREAMS' | 'AUTH' | 'UBI' | 'INTERNAL' | 'EXTERNAL' | 'GENERIC' | 'UNKNOWN';

export class Log {
    private client: ClientUser;
    private webhook: WebhookClient;
    private defaultContext: Context;

    public constructor(client: ClientUser, webhook?: WebhookClient, defaultContext: Context = 'UNKNOWN') {
        // console.log('LOGGER', client, defaultContext, webhook);
        this.client = client;
        this.defaultContext = defaultContext;
        this.webhook = webhook;
    }

    public sendWebhook(context: Context, type: 'Information' | 'Warning' | 'Error', body: string, color: number) {
        return this.webhook && this.webhook.send('', { embeds: [{
            author: {
                iconURL: this.client.displayAvatarURL(),
                name: this.client.tag,
            },
            color,
            description: `**${type}** Message`,
            fields: [{
                name: `_${context}_:`,
                value: body,
            }],
            timestamp: Date.now(),
        }] });
    }

    public log(msg: any, context: Context = this.defaultContext) {
        console.log(`[${context}]`, msg);
        this.sendWebhook(context, 'Information', msg, 6513507);
    }

    public warn(msg: any, context: Context = this.defaultContext) {
        console.warn(`[${context}]`, msg);
        this.sendWebhook(context, 'Warning', msg, 16763904);
    }

    public error(msg: any, context: Context = this.defaultContext) {
        console.error(`[${context}]`, msg);
        this.sendWebhook(context, 'Error', msg, 13382400);
    }
}
