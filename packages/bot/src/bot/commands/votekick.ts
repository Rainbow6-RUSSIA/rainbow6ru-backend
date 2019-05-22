import { Command } from 'discord-akairo';
import { Collection, GuildMember, Message, MessageReaction, User } from 'discord.js';
import { debug } from '../..';
import PartyCommand, { IArgsPartyCommand } from '../../utils/decorators/party_command';

interface IArgs extends IArgsPartyCommand {
    target: GuildMember;
}

export default class Votekick extends Command {
    public constructor() {
        super('votekick', {
            aliases: ['votekick', 'VK'],
            args: [{
                id: 'target',
                type: 'member',
            }],
        });
    }

    @PartyCommand(true)
    public async exec(message: Message, args: IArgs) {
        const { target, lobby, LS } = args;
        const voice = lobby.dcChannel;
        const vote = await message.channel.send(`Голосование за исключение <@${target.id}> (15 сек.)\n<@${voice.members.filter((m) => m.id !== target.id).map((m) => m.id).join('>, <@')}>`) as Message;
        const emojis = ['❎', '✅'];
        await Promise.all(emojis.map((e) => vote.react(e)));
        const votes: Collection<string, boolean> = new Collection();
        const filter = (reaction: MessageReaction, user: User) => emojis.includes(reaction.emoji.name);
        const collector = vote.createReactionCollector(filter, { time: 20000 });
        collector.on('collect', async (reaction, user) => {
            votes.set(user.id, Boolean(emojis.indexOf(reaction.emoji.name)));
            if (voice.members.filter((m) => m.id !== target.id).every((m) => votes.filter(Boolean).has(m.id))) {
                await LS.kick(target, 120000, 'Вы временно отстранены от поиска по результатам голосования!');
                return vote.edit(`<@${target.id}> исключен\n<@${voice.members.filter((m) => m.id !== target.id).map((m) => m.id).join('>, <@')}>`);
            }
        });
        collector.on('end', async (collected) => {
            if (!voice.members.filter((m) => m.id !== target.id).every((m) => votes.filter(Boolean).has(m.id))) {
                await vote.reactions.clear();
                await vote.edit(`Недостаточно голосов для исключения <@${target.id}>\n<@${voice.members.filter((m) => m.id !== target.id).map((m) => m.id).join('>, <@')}>`);
                return vote.delete({ timeout: 30000 });
            }
        });
    }
}
