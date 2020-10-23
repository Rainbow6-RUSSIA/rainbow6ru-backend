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
        const { description, target, room } = args;
        if (!target) {
            return DMReply(message, 'Вы не указали цель голосования!');
        }
        if (target.id === room.dcLeader?.id) {
            return DMReply(message, 'Вы не можете голосовать за исключение лидера канала!');
        }
        if (message.author.id === target.id) {
            return DMReply(message, 'Вы не можете голосовать за исключение себя!');
        }
        const voice = room.dcChannel;
        if (!voice.members.has(target.id)) {
            return DMReply(message, 'Вы не можете голосовать за исключение участника из другого канала!');
        }
        if (!description) {
            return DMReply(message, 'Вы не указали причину исключения!');
        }
        const vote = await message.channel.send(`Голосование за исключение ${target} (30 сек.)\n${voice.members.filter(m => m.id !== target.id).array().join(', ')}`) as Message;
        const emojis = ['❎', '✅'];
        await Promise.all(emojis.map(e => vote.react(e)));
        
        const votes: Collection<string, boolean> = new Collection();
        votes.set(message.author.id, true);

        const filter = (reaction: MessageReaction, user: User) => emojis.includes(reaction.emoji.name);
        const collector = vote.createReactionCollector(filter, { time: 30000 });
        collector.on('collect', async (reaction, user) => {
            votes.set(user.id, Boolean(emojis.indexOf(reaction.emoji.name)));
            if (voice.members.filter(m => m.id !== target.id).every(m => votes.has(m.id))) {
                collector.stop();
            }
        });
        collector.on('end', async collected => {
            const VM = voice.members.filter(m => m.id !== target.id);
            const results = VM.map(m => `${m.user} - \\${!votes.has(m.id) ? '❔' : emojis[Number(votes.get(m.id))]}`).join(', ')
            if (!VM.every(m => votes.filter(Boolean).has(m.id))) {
                await vote.reactions.clear();
                await vote.edit(`Недостаточно голосов для исключения ${target}\n${results}`);
            } else {
                await debug.log(`${results} исключили ${target} из \`${room.LS.settings.type}\` по причине \`${description}\`. ID пати \`${room.id}\``);
                await room.LS.kick(target, 1200000, 'Вы исключены из канала по результатам голосования!', room);
                await vote.edit(`${target} исключен\n${results}`);
            }
            return vote.delete({ timeout: 30000 });
        });
        
    }
}
