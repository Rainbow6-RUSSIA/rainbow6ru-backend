import { Guild } from '@r6ru/db';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { debug } from '../../..';
import PartyCommand, { IArgsPartyCommand } from '../../../utils/decorators/party_command';
import RequireVoice from '../../../utils/decorators/require_voice';
import embeds from '../../../utils/embeds';
import ENV from '../../../utils/env';
import { lobbyStores } from '../../lobby';

interface IArgs {
    description: string;
}

export default class Party extends Command {
    public constructor() {
        super('party', {
            aliases: ['MM', 'party'],
            args: [{
                id: 'description',
                match: 'rest',
                type: 'string',
            }],
            channel: 'guild',
            cooldown: 10000,
        });
        this.exec = this.exec.bind(this);
        this.execDefaultParty = this.execDefaultParty.bind(this);
        this.execDonateParty = this.execDonateParty.bind(this);
        // this.handler.useInhibitorHandler();
    }

    @RequireVoice
    public async exec(message: Message, args: IArgs) {
        // const lobby = LS.lobbies.get(message.member.voice.channelID);
        const voice = message.member.voice.channel;
        if (lobbyStores.has(voice.parentID) && lobbyStores.get(voice.parentID).lobbies.has(voice.id)) {
            return this.execDefaultParty(message, args);
        } else {
            const { description } = args;
            switch (true) {
                case !description:
                    return this.execDefaultParty(message, args);
                case description.startsWith('donate'):
                case description.startsWith('premium'): {
                    const dbGuild = await Guild.findByPk(message.guild.id);
                    if (message.member.roles.has(dbGuild.donateRoles.default[0]) || message.member.premiumSince) {
                        args.description = description.slice(description.split(' ')[0].length).trim();
                        return this.execDonateParty(message, args);
                    } else {
                        return message.author.send('Аргумент `donate` или `premium` доступен только донатерам или поддержавшим с помощью Nitro Boost');
                    }
                }
                // case description.startsWith('youtube'):
                case description.startsWith('twitch'):
                case description.startsWith('stream'): {
                    return this.execDefaultParty(message, args);
                }
                default:
                    return this.execDefaultParty(message, args);
            }
        }
    }

    public async execDonateParty(message: Message, args: IArgs) {
        const { description } = args;
        const inv = await message.member.voice.channel.createInvite({ maxAge: parseInt(ENV.INVITE_AGE) / 5});
        const msg = await message.channel.send('@here', embeds.appealMsgPremium(message.member, description, inv.url)) as Message;
        msg.delete({ timeout: parseInt(ENV.INVITE_AGE) * 1000 / 5 });

    }

    @PartyCommand()
    public async execDefaultParty(message: Message, args: IArgs & IArgsPartyCommand): Promise<any> {
        const { description, lobby, LS } = args;

        const inv = await lobby.dcChannel.createInvite({maxAge: parseInt(ENV.INVITE_AGE) });
        lobby.invite = inv.url;
        lobby.description = description;
        await lobby.save();
        lobby.dcInvite = inv;
        if (lobby.appealMessage) {
            try {
                await lobby.appealMessage.delete();
            } catch (error) {
                // console.log(error)
            }
        }
        lobby.appealMessage = await LS.lfgChannel.send('', await embeds.appealMsg(lobby)) as Message;
        LS.updateFastAppeal();
        return debug.log(`${message.author} ищет пати в \`${lobby.type}\` с описанием: \`${lobby.description}\`. ID пати \`${lobby.id}\``);
    }
}
