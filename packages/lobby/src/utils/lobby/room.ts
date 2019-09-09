import { Lobby, User } from '@r6ru/db';
import { currentlyPlaying, emojiButtons, IngameStatus as IS } from '@r6ru/types';
import { CategoryChannel, Collection, Guild, GuildMember, Invite, Message, MessageOptions, MessageReaction, ReactionCollector, User as U, VoiceChannel } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { debug } from '../..';
import { LobbyStore } from '../../bot/lobby';
import WaitLoaded from '../decorators/wait_loaded';
import embeds from '../embeds';
import ENV from '../env';
import { applyMixins } from '../mixin';

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
            close: false,
            hardplay: false,
            initiatedAt: new Date(),
            type: LS.settings.type,
        });
        this.LS = LS;
        this.dcChannel = voice;
        this.dcCategory = voice.parent;
        this.dcGuild = voice.guild;
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
            const filter = (reaction: MessageReaction, user: U) => !user.bot && emojiButtons.reverse[reaction.emoji.name] && (this.dcLeader.id === user.id || this.dcGuild.member(user).hasPermission('MANAGE_ROLES'));
            this.reactionBarCollector = this.appealMessage.createReactionCollector(filter, {dispose: true});
            (async () => {
                for (const r of Object.values(emojiButtons.direct)) {
                    await this.appealMessage.react(r);
                }
            })();
            this.reactionBarCollector.on('collect', (reaction, user) => this.handleAction(emojiButtons.reverse[reaction.emoji.name], true));
            this.reactionBarCollector.on('remove', (reaction, user) => this.handleAction(emojiButtons.reverse[reaction.emoji.name], false));
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
        if (this.appealTimeout || (this.appealMessage.editedTimestamp || this.appealMessage.createdTimestamp) > (Date.now() - 2000)) {
            this.appealTimeoutMsg = embeds.appealMsg(this);
            if (!this.appealTimeout) {
                clearTimeout(this.appealTimeout);
                this.appealTimeout = setTimeout(() => (this.appealTimeout = null) || this.updateAppeal(this.appealTimeoutMsg), Date.now() - (this.appealMessage.editedTimestamp || this.appealMessage.createdTimestamp) + 1);
            }
        } else {
            // console.log(this.dcChannel.name);
            // console.log({a: await this.dcChannel.fetch()});
            await this.appealMessage.edit('', appeal || embeds.appealMsg(this));
        }
    }

    public async handleAction(action: keyof typeof emojiButtons.direct, flag: boolean) {
        // console.log('ACTION', action, 'FLAG', flag, this.hardplay, this.close);
        if (this[action] === flag) { return; }
        this[action] = flag;
        await this.save();
        switch (action) {
            case 'close': {
                // flag = !flag;
                // console.log(flag ? this.LS.roomSize : this.dcMembers.size);
                await this.dcChannel.setUserLimit(flag ? this.dcMembers.size : this.LS.roomSize);
                debug.log(`${this.dcLeader} ${!this.close ? 'открыл' : 'закрыл'} лобби!. ID пати \`${this.id}\``);
                try {
                    this.dcLeader.send(`Лобби ${!this.close ? 'открыто' : 'закрыто'}!`);
                } catch (error) {
                    //
                }
                break;
            }
            case 'hardplay': {
                if (flag) {
                    const allRoles = new Set(this.guild.rankRoles);
                    const allowedRoles = new Set(this.guild.rankRoles.slice(this.minRank));
                    allRoles.delete(''); allowedRoles.delete('');
                    const disallowedRoles = new Set([...allRoles].filter(r => !allowedRoles.has(r)));
                    this.dcChannel = await this.dcChannel.edit({
                        name: this.dcChannel.name.replace(/HardPlay /g, '').replace(' ', ' HardPlay '),
                        permissionOverwrites: this.dcChannel.permissionOverwrites.filter(o => !disallowedRoles.has(o.id)),
                    }) as VoiceChannel;
                    debug.log(`${this.dcLeader} ${!this.hardplay ? 'деактивировал' : 'активировал'} HardPlay лобби!. ID пати \`${this.id}\``);
                    try {
                        this.dcLeader.send(`HardPlay лобби ${!this.hardplay ? 'деактивировано' : 'активировано'}!`);
                    } catch (error) {
                        //
                    }
                } else {
                    this.dcChannel = await this.dcChannel.edit({
                        name: this.dcChannel.name.replace(/HardPlay /g, ''),
                        permissionOverwrites: this.dcChannel.parent.permissionOverwrites,
                    }) as VoiceChannel;
                }
                break;
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
        return !this.close && (this.dcChannel.members.size < this.dcChannel.userLimit) && !currentlyPlaying.includes(this.status);
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

applyMixins(LSRoom, [Lobby]);
