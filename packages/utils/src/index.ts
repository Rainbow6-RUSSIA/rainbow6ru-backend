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
    return [
        '1⃣',
        '2⃣',
        '3⃣',
        '4⃣',
        '5⃣',
        '6⃣',
        '7⃣',
        '8⃣',
        '9⃣',
        '🇦',
        '🇧',
        '🇨',
        '🇩',
        '🇪',
        '🇫',
        '🇬',
        '🇭',
        '🇮',
        '🇯',
        '🇰',
        '🇱',
        '🇲',
        '🇳',
        '🇴',
        '🇵',
        '🇶',
        '🇷',
        '🇸',
        '🇺',
        '🇻',
        '🇼',
        '🇽',
        '🇾',
        '🇿',
    ].slice(0, n);
}

export async function DMReply(message: Message, text: string, timeout = 30000) {
    try {
        return message.author.send(text[0].toUpperCase() + text.slice(1));
    } catch (err) {
        const msg = await message.reply(text[0].toLowerCase() + text.slice(1));
        return msg.delete({ timeout });
    }
}

export async function combinedPrompt(
    prompt: Message,
    options: {
        emojis?: string[] | EmojiResolvable[];
        texts?: Array<string | string[]>;
        author: User;
        time?: number;
        keep?: boolean;
    },
): Promise<number> {
    const { author } = options;
    const time = options.time || 5 * 60 * 1000;
    options.emojis = options.emojis || [];
    options.texts = options.texts || [];

    (async () => {
        for (const e of options.emojis) {
            await prompt.react(e);
        }
    })();

    const emojiFilter = (reaction: MessageReaction, user: User) =>
        options.emojis.includes(reaction.emoji.id || reaction.emoji.name) && user.id === author.id;

    const textFilter = (msg: Message) => {
        const answ =
            msg.author.id === author.id &&
            options.texts.some(([...t]) => t.some((txt) => msg.content.toLowerCase().includes(txt)));
        if (answ && !options.keep) {
            msg.delete();
        }
        return answ;
    };

    const race = await Promise.race([
        prompt.awaitReactions(emojiFilter, { max: 1, time }),
        prompt.channel.awaitMessages(textFilter, { max: 1, time }),
    ]);
    const result = race.first() as any;
    if (!options.keep) {
        prompt.delete({ timeout: 5000 });
    }
    // console.log({result}, result instanceof Message, result instanceof MessageReaction)
    if (result?.channel) {
        return options.texts.findIndex(([...t]) => t.some((txt) => result.content.toLowerCase().includes(txt)));
    } else if (result?.message) {
        return options.emojis.indexOf(result.emoji.id || result.emoji.name);
    }
    return -1;
}

type Context = 'BOT' | 'STREAMS' | 'AUTH' | 'UBI' | 'INTERNAL' | 'EXTERNAL' | 'GENERIC' | 'UNKNOWN';

export class Log {
    private readonly client: ClientUser;
    private readonly webhook: WebhookClient;
    private readonly defaultContext: Context;

    public constructor(client: ClientUser, webhook?: WebhookClient, defaultContext: Context = 'UNKNOWN') {
        // console.log('LOGGER', client, defaultContext, webhook);
        this.client = client;
        this.defaultContext = defaultContext;
        this.webhook = webhook;
    }

    public paragraphSplit = (joinWith: string) => (a: string[], b: string) => {
        if (a.length === 0) {
            return [b];
        }
        const c = a[a.length - 1] + joinWith + b;
        if (c.length <= 1000) {
            a[a.length - 1] = c;
        } else {
            a.push(b);
        }
        return a;
    };

    public sendWebhook<T>(
        context: Context,
        type: 'Information' | 'Warning' | 'Error',
        body: T,
        color: number,
        ping: boolean,
        retry = 0,
    ) {
        try {
            return this.webhook?.send(ping ? '@everyone' : '', {
                embeds: [
                    {
                        author: {
                            iconURL: this.client.displayAvatarURL(),
                            name: this.client.tag,
                        },
                        color,
                        description: `**${type}** Message`,
                        fields: (body instanceof Error
                            ? body.stack
                                  .split('\n')
                                  .reduce(this.paragraphSplit('\n'), [])
                                  .map((ch) => `\`\`\`js\n${ch}\n\`\`\``)
                            : (() => {
                                  const chunks = body.toString().split('\n').reduce(this.paragraphSplit('\n'), []);
                                  return chunks.some((ch) => ch.length > 1000)
                                      ? body.toString().split(' ').reduce(this.paragraphSplit(' '), [])
                                      : chunks;
                              })()
                        ).map((ch) => ({
                            name: `_${context}_:`,
                            value: ch,
                        })),
                        timestamp: Date.now(),
                    },
                ],
            });
        } catch (err) {
            if (retry < 2) {
                this.sendWebhook(context, type, body, color, ping, retry + 1);
            }
        }
    }

    public log(msg: any, context = this.defaultContext, ping = false) {
        console.log(`[INFO][${context}]`, msg);
        try {
            return this.sendWebhook(context, 'Information', msg, 6513507, ping);
        } catch (error) {
            console.log('WEBHOOK SEND ERROR', error);
        }
    }

    public warn(msg: any, context = this.defaultContext, ping = false) {
        console.warn(`[WARN][${context}]`, msg);
        try {
            return this.sendWebhook(context, 'Warning', msg, 16763904, ping);
        } catch (error) {
            console.log('WEBHOOK SEND ERROR', error);
        }
    }

    public error(msg: any, context = this.defaultContext, ping = !(msg instanceof Error)) {
        console.error(`[ERROR][${context}]`, msg);
        try {
            return this.sendWebhook(context, 'Error', msg, 13382400, ping);
        } catch (error) {
            console.log('WEBHOOK SEND ERROR', error);
        }
    }
}

const names = [
    'ATMs',
    'Anchor',
    'Antechamber',
    'Aquarium',
    'Archives',
    'Armory',
    'Attic',
    'BBQ',
    'Backyard',
    'Bakery',
    'Balcony',
    'Bar',
    'Barn',
    'Barnyard',
    'Bathroom',
    'Bedroom',
    'Boulevard',
    'Brewery',
    'Bridge',
    'Bunk',
    'Bunker',
    'Cabin',
    'Cabinet',
    'Cafe',
    'Campfire',
    'Camping',
    'Cantina',
    'Casino',
    'Caterer',
    'Chapel',
    'Church',
    'Classroom',
    'Clearance',
    'Cliffside',
    'Cockpit',
    'Container',
    'Courtyard',
    'Crypt',
    'Depot',
    'Detention',
    'Dormitory',
    'Dorms',
    'Driveway',
    'Dumpster',
    'Elevator',
    'Engine',
    'Exhibition',
    'Farmlands',
    'Festival',
    'Fountain',
    'Foyer',
    'Gallery',
    'Garage',
    'Garden',
    'Gargoyle',
    'Garrage',
    'Gazeebo',
    'Greenhouse',
    'Gym',
    'Hallway',
    'Hammam',
    'Helipad',
    'Infirmary',
    'Jacuzzi',
    'Junkyard',
    'Karaoke',
    'Kennels',
    'Kitchen',
    'Lakeside',
    'Landing',
    'Laundry',
    'Library',
    'Lobby',
    'Lockers',
    'Lockgate',
    'Lounge',
    'Market',
    'Mezzanine',
    'Mudroom',
    'Museum',
    'Office',
    'Palms',
    'Pantry',
    'Park',
    'Parking',
    'Patio',
    'Penthouse',
    'Pergola',
    'Pipes',
    'Plaza',
    'Pool',
    'Radio',
    'Reception',
    'Restaurant',
    'Roundabout',
    'Sailboats',
    'Shop',
    'Showers',
    'Snowmobiles',
    'Storage',
    'Street',
    'Study',
    'Submarine',
    'Taiko',
    'Teacups',
    'Tellers',
    'Terrace',
    'Theater',
    'Tower',
    'Valley',
    'Vault',
    'Ventilation',
    'Veranda',
    'Village',
    'Walk-in',
    'Walkway',
    'Warehouse',
    'Workshop',
    'Zodiac',
];

export default class NameGen {
    public names: string[];

    constructor() {
        this.names = names.sort(() => Math.random() - 0.5);
    }

    public next() {
        const name = this.names.shift();
        this.names.push(name);
        return name;
    }
}
