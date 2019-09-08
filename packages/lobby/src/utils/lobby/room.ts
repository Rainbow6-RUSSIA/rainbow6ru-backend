import { Lobby, User } from '@r6ru/db';
import { IngameStatus as IS } from '@r6ru/types';
import { CategoryChannel, Collection, Guild, GuildMember, Invite, Message, MessageOptions, MessageReaction, ReactionCollector, User as U, VoiceChannel } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { debug } from '../..';
import { LobbyStore } from '../../bot/lobby';
import WaitLoaded from '../decorators/wait_loaded';
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

    constructor(voice: VoiceChannel, LS: LobbyStore) {
        super({
            channel: voice.id,
            hardplay: false,
            initiatedAt: new Date(),
            open: true,
            type: LS.settings.type,
        });
        this.LS = LS;
        this.dcChannel = voice;
        this.dcCategory = voice.parent;
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

        this.status = IS.OTHER;

        return this;

    }

    public async initInvite() {
        if (this.dcInvite && (this.dcInvite.expiresTimestamp - Date.now()) > 0) {
            return this.dcInvite;
        } else {
            console.log('INIT INVITE', this.dcChannel.name);
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
            console.log('INIT APPEAL', this.dcChannel.name);
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

    @WaitLoaded
    public async join(member: GuildMember, internal?: boolean) {
        console.log(member.user.tag, 'JOINED', this.dcChannel.name);
    }

    @WaitLoaded
    public async leave(member: GuildMember, internal?: boolean) {
        console.log(member.user.tag, 'LEFT', this.dcChannel.name);
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
        console.log('ACTION', action, 'FLAG', flag);
        this[action] = flag;
        await this.save();
        switch (action) {
            case 'open': {
                await this.dcChannel.setUserLimit(flag ? this.LS.roomSize : this.dcMembers.size);
                debug.log(`${this.dcLeader} ${this.open ? 'открыл' : 'закрыл'} лобби!. ID пати \`${this.id}\``);
                try {
                    this.dcLeader.send(`Лобби ${this.open ? 'открыто' : 'закрыто'}!`);
                } catch (error) {
                    //
                }
            }
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
                    debug.log(`${this.dcLeader} ${!this.hardplay ? 'деактивировал' : 'активировал'} HardPlay лобби!. ID пати \`${this.id}\``);
                    try {
                        this.dcLeader.send(`HardPlay лобби ${!this.hardplay ? 'деактивировано' : 'активировано'}!`);
                    } catch (error) {
                        //
                    }
                } else {
                    await this.dcChannel.edit({
                        name: this.dcChannel.name.replace(/HardPlay /g, ''),
                        permissionOverwrites: this.dcChannel.parent.permissionOverwrites,
                    });
                }
            }
        }
        this.updateAppeal();
    }

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

    public waitLoaded = async () => {
        return new Promise(resolve => {
            const waiter = () => {
                if (this.status !== IS.LOADING) { return resolve(); }
                setTimeout(waiter, 25);
            };
            waiter();
        });
    }
}

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
        });
    });
}

applyMixins(LSRoom, [Lobby]);
