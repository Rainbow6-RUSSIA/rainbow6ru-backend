import { DMReply } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import { Collection, GuildMember, Message, MessageReaction, User } from 'discord.js';
import { debug } from '../../..';
import PartyCommand, { IArgsPartyCommand } from '../../../utils/decorators/party_command';
import RequireVoice from '../../../utils/decorators/require_voice';

interface IArgs extends IArgsPartyCommand {
    target: GuildMember;
    description: string;
}

export default class Votekick extends Command {
    public constructor() {
        super('votekick', {
            aliases: ['votekick', 'VK'],
            args: [{
                id: 'target',
                type: 'member',
            }, {
                id: 'description',
                match: 'rest',
                type: 'string',
            }],
        });
    }

    @RequireVoice
    @PartyCommand(true)
    public async exec(message: Message, args: IArgs) {
        const { description, target, lobby, LS } = args;
        if (!target) {
            return DMReply(message, 'Вы не указали цель голосования!');
        }
        if (!description) {
            return DMReply(message, 'Вы не указали причину исключения!');
        }
        const voice = lobby.dcChannel;
        if (message.author.id === target.id) {
            return DMReply(message, 'Вы не можете голосовать за исключение себя!');
        }
        if (!voice.members.has(target.id)) {
            return DMReply(message, 'Вы не можете голосовать за исключение участника из другого канала!');
        }
        const vote = await message.channel.send(`Голосование за исключение ${target} (30 сек.)\n${voice.members.filter((m) => m.id !== target.id).array().join(', ')}`) as Message;
        const emojis = ['❎', '✅'];
        await Promise.all(emojis.map((e) => vote.react(e)));
        const votes: Collection<string, boolean> = new Collection();
        const filter = (reaction: MessageReaction, user: User) => emojis.includes(reaction.emoji.name);
        const collector = vote.createReactionCollector(filter, { time: 30000 });
        collector.on('collect', async (reaction, user) => {
            votes.set(user.id, Boolean(emojis.indexOf(reaction.emoji.name)));
            if (voice.members.filter((m) => m.id !== target.id).every((m) => votes.filter(Boolean).has(m.id))) {
                collector.stop();
            }
        });
        collector.on('end', async (collected) => {
            const VM = voice.members.filter((m) => m.id !== target.id);
            if (!VM.every((m) => votes.filter(Boolean).has(m.id))) {
                await vote.reactions.clear();
                await vote.edit(`Недостаточно голосов для исключения ${target}\n${VM.array().join(', ')}`);
            } else {
                await debug.log(`${VM.array().join(', ')} исключили ${target} из \`${lobby.type}\` по причине \`${description}\`. ID пати \`${lobby.id}\``);
                await LS.kick(target, 300000, 'Вы временно отстранены от поиска по результатам голосования!', lobby.id);
                await vote.edit(`${target} исключен\n${VM.array().join(', ')}`);
            }
            return vote.delete({ timeout: 30000 });
        });
    }
}
