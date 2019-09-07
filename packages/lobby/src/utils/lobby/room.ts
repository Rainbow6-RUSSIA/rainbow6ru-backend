import { Lobby, User } from '@r6ru/db';
import { IngameStatus as IS } from '@r6ru/types';
import { CategoryChannel, Collection, Guild, GuildMember, Invite, Message, MessageOptions, MessageReaction, ReactionCollector, User as U, VoiceChannel } from 'discord.js';
import { $enum } from 'ts-enum-util';
import bot from '../../bot';
import { LobbyStore } from '../../bot/lobby';
import embeds from '../embeds';
import ENV from '../env';

const currentlyPlaying = [IS.CASUAL, IS.RANKED, IS.CUSTOM, IS.NEWCOMER, IS.DISCOVERY];
const emojiButtons = {
    hardplay: '🏆',
    open: '🔐',
};

export class LSRoom extends Lobby {
    public LS: LobbyStore;

    public dcInvite: Invite;
    public appealMessage: Message;
    public appealTimeout: NodeJS.Timeout;
    public appealTimeoutMsg: MessageOptions;
    public reactionBarCollector: ReactionCollector;
    public dcCategory: CategoryChannel;
    public dcChannel: VoiceChannel;
    public dcGuild: Guild;
    public dcLeader: GuildMember;

    public get minRank() {
        return Math.min(...this.members.map(m => m.rank));
    }

    public get maxRank() {
        return Math.max(...this.members.map(m => m.rank));
    }

    public get limitRank() {
        return this.minRank === Infinity ? 0 : this.minRank - this.minRank % 4 + 1;
    }

    public get joinAllowed() {
        return this.open && (this.dcChannel.members.size < this.dcChannel.userLimit) && !currentlyPlaying.includes(this.status);
    }

    public get dcMembers() {
        return this.dcChannel.members;
    }

    public get leader() {
        return this.members.find(m => m.id === this.dcLeader.id);
    }

    public get categoryVoices() {
        return this.dcCategory.children.filter(ch => ch instanceof VoiceChannel && !ch.deleted).sort((a, b) => a.position - b.position) as Collection<string, VoiceChannel>;
    }

    constructor(voice: VoiceChannel, LS: LobbyStore) {
        super({
            channel: voice.id,
            hardplay: false,
            initiatedAt: new Date(),
            open: true,
            type: LS.type,
        });
        this.dcChannel = voice;
        // this.dcCategory = voice.parent;
        // this.dcGuild = voice.guild;
        this.dcLeader = this.dcMembers.random();
        // this.save();
    }

    public async init() {
        await this.dcChannel.edit({
            name: this.dcChannel.name.replace(/HardPlay /g, '').replace(/#\d+/g, `#${this.dcChannel.position + 1}`),
            permissionOverwrites: this.dcChannel.parent.permissionOverwrites,
            userLimit: this.LS.roomSize,
        }, 'инициализация комнаты');

        await this.save();
        await this.$set('guild', this.dcChannel.guild.id);
        await this.$set('members', await User.findAll({ where: { id: this.dcMembers.map(m => m.id) } }));
        await this.reload({ include: [{all: true}] });

        if (this.dcLeader) {
            await this.initAppeal();
        }
        if (this.categoryVoices.lastKey() === this.channel) {
            await this.initInvite();
        }

        return this;

    }

    public async initInvite() {
        if (this.dcInvite && (this.dcInvite.expiresTimestamp - Date.now()) > 0) {
            return this.dcInvite;
        } else {
            const inv = await this.dcChannel.createInvite({ maxAge: parseInt(ENV.INVITE_AGE) });
            this.invite = inv.url;
            this.dcInvite = inv;
            await this.save();
            return inv;
        }
    }

    public async initAppeal() {
        await this.initInvite();
        if (!this.appealMessage) {
            this.appealMessage = await this.LS.lfgChannel.send('', embeds.appealMsg(this));
            const filter = (reaction: MessageReaction, user: U) => emojiButtons[reaction.emoji.name] && this.dcLeader.id === user.id;
            this.reactionBarCollector = this.appealMessage.createReactionCollector(filter);
            (async () => {
                for (const r of $enum(emojiButtons).getValues()) {
                    await this.appealMessage.react(r);
                }
            })();
        }
        return this.appealMessage;
    }

    public async updateAppeal(appeal?: MessageOptions) {
        await this.initAppeal();
        if ((this.appealMessage.editedTimestamp || this.appealMessage.createdTimestamp) > (Date.now() - 3000)) {
            this.appealTimeoutMsg = embeds.appealMsg(this);
            if (!this.appealTimeout) {
                this.appealTimeout = setTimeout(() => (this.appealTimeout = null) || this.updateAppeal(this.appealTimeoutMsg), Date.now() - (this.appealMessage.editedTimestamp || this.appealMessage.createdTimestamp) + 500);
            }
        } else {
            await this.dcChannel.fetch();
            await this.appealMessage.edit('', appeal || embeds.appealMsg(this));
        }
    }

    public async handleAction(action: keyof typeof emojiButtons, flag: boolean) {
        this[action] = flag;
        await this.save();
        switch (action) {
            case 'open': await this.dcChannel.setUserLimit(flag ? this.LS.roomSize : this.dcMembers.size);
            case 'hardplay': {
                if (flag) {
                    const HP = this.dcChannel.name.replace(' ', ' HardPlay ');
                    const allRoles = new Set(this.guild.rankRoles);
                    const allowedRoles = new Set(this.guild.rankRoles.slice(this.minRank));
                    allRoles.delete(''); allowedRoles.delete('');
                    const disallowedRoles = new Set([...allRoles].filter(r => !allowedRoles.has(r)));
                    await this.dcChannel.edit({
                        name: /HardPlay /g.test(HP) ? HP : this.dcChannel.name.replace('', 'HardPlay '),
                        permissionOverwrites: this.dcChannel.permissionOverwrites.filter(o => !disallowedRoles.has(o.id)),
                    });
                } else {
                    await this.dcChannel.edit({
                        name: this.dcChannel.name.replace(/HardPlay /g, ''),
                        permissionOverwrites: this.dcChannel.parent.permissionOverwrites,
                    });
                }
            }
        }
    }
}
