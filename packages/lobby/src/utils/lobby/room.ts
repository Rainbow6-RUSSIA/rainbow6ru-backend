import { Lobby, User } from '@r6ru/db';
import { currentlyPlaying, emojiButtons, IngameStatus as IS } from '@r6ru/types';
import { CategoryChannel, Collection, Guild, GuildMember, Invite, Message, MessageOptions, MessageReaction, ReactionCollector, User as U, VoiceChannel } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { LobbyStore, lobbyStores, lobbyStoresRooms } from '.';
import { debug } from '../..';
import PresenceUpdate from '../../bot/listeners/presenceUpdate';
import embeds from '../embeds';
import ENV from '../env';
import { applyMixins } from '../mixin';

export class LSRoom extends Lobby {
    public LS: LobbyStore;

    public appealMessage: Message;
    public appealTimeout: NodeJS.Timeout;
    public appealTimeoutMsg: MessageOptions;

    public reactionBarCollector: ReactionCollector;

    public dcInvite: Invite;
    public dcCategory: CategoryChannel;
    public dcChannel: VoiceChannel;
    public dcGuild: Guild;
    public dcLeader: GuildMember;

    public lastStatusUpdate: Date;
    public statusUpdateTimeout: NodeJS.Timeout;
    public lastActionHandle: Date;
    public actionHandleTimeout: NodeJS.Timeout;

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
        try {
            await this.dcChannel.edit({
                name: this.dcChannel.name.replace(/HardPlay /g, '').replace(/#\d+/g, `#${this.dcChannel.position + 1}`),
                permissionOverwrites: this.dcChannel.parent.permissionOverwrites,
                userLimit: this.LS.roomSize,
            }, 'инициализация комнаты');
        } catch (error) {
            console.log('FAIL ON INIT', error);
        }

        const previousLobby = await Lobby.findOne({ where: { channel: this.dcChannel.id }, order: [['initiatedAt', 'DESC']] });
        this.description = previousLobby && previousLobby.description;

        await this.save();
        await this.$set('guild', this.dcChannel.guild.id);
        await this.$set('members', await User.findAll({ where: { id: this.dcMembers.map(m => m.id) } }));
        await this.reload({ include: [{all: true}] });

        if (this.dcLeader && this.dcLeader.user) {
            await this.initAppeal();
        }
        if (this.categoryVoices.lastKey() === this.channel) {
            await this.initInvite();
        }

        this.status = IS.OTHER;
        this.lastStatusUpdate = new Date('2000');
        this.lastActionHandle = new Date('2000');

        await PresenceUpdate.handle(this);

        // this.statusUpdateInterval = setInterval(() => PresenceUpdate.handle(this), 3000);

        return this;

    }

    public async initInvite() {
        if (this.dcInvite && (this.dcInvite.expiresTimestamp - Date.now()) > 0) {
            return this.dcInvite;
        } else {
            // console.log('INIT INVITE', this.dcChannel.name);
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
            // console.log('INIT APPEAL', this.dcChannel.name);
            this.appealMessage = await this.LS.lfgChannel.send('', embeds.appealMsg(this));
            const filter = (reaction: MessageReaction, user: U) => !user.bot && emojiButtons.reverse[reaction.emoji.name] && (this.dcLeader.id === user.id || this.dcGuild.member(user).hasPermission('MANAGE_ROLES'));
            this.reactionBarCollector = this.appealMessage.createReactionCollector(filter, {dispose: true});
            (async () => {
                for (const r of Object.values(emojiButtons.direct)) {
                    await this.appealMessage.react(r);
                }
            })();
            const barHandler = (flag: boolean) =>
                (reaction: MessageReaction, user: U) =>
                    (this.lastActionHandle.valueOf() < (Date.now() - parseInt(ENV.MESSAGE_COOLDOWN)) || this.dcGuild.member(user).hasPermission('MANAGE_ROLES'))
                        && this.handleAction(emojiButtons.reverse[reaction.emoji.name], flag);
            this.reactionBarCollector.on('collect', barHandler(true));
            this.reactionBarCollector.on('remove', barHandler(false));
        }
        return this.appealMessage;
    }

    public async deactivate() {
        // console.log('DEACTIVATE', this.dcChannel.name);
        lobbyStoresRooms.delete(this.channel);
        this.active = false;
        await Promise.all([
            this.save(),
            (this.appealMessage && this.appealMessage.delete().catch(e => console.log('DESTROY APPEAL FAILED', e))),
            // (!appealOnly && this.dcChannel.delete().catch(e => console.log('DESTROY VOICE FAILED', e))),
        ]);
    }

    public async join(member: GuildMember, internal?: boolean) {
        // console.log(member.user.tag, 'JOINED', this.dcChannel.name);
        if (!this.LS.uniqueUsers.has(member.id)) {
            const localLS = lobbyStores.filter(LS => LS.guild.id === member.guild.id);
            const uniqueUsersPerGuild = new Set([].concat(...localLS.map(LS => [...LS.uniqueUsers])));
            if (!uniqueUsersPerGuild.has(member.id)) {
                await User.update({ nicknameUpdatedAt: new Date('2000') }, { where: { id: member.id } });
            }
        }
        this.LS.uniqueUsers.add(member.id);
        await this.$add('members', member.id);
        await this.reload({include: [{all: true}]});
        // console.log(this.members.find(m => m.id === member.id));
        if (!this.dcLeader || !this.dcMembers.has(this.dcLeader.id)) {
            this.dcLeader = member;
        }
        if (this.appealMessage || this.dcMembers.size >= this.LS.roomSize) {
            await this.updateAppeal();
        }
    //     await this.refreshIngameStatus(this);
    }

    public async leave(member: GuildMember, internal?: boolean) {
        // console.log(member.user.tag, 'LEFT', this.dcChannel.name);
        await this.$remove('members', member.id);
        await this.reload({include: [{all: true}]});
        if (this.close) {
            this.handleAction('close', false);
            this.dcChannel = await this.dcChannel.setUserLimit(this.LS.roomSize);
        }
        if (!this.dcMembers.size) {
            this.dcLeader = null;
        }
        if (this.dcMembers.size !== 0 && member.id === this.dcLeader.id) {
            const newLeader = this.dcMembers.random();
            this.handleAction('hardplay', false);
            try {
                newLeader.send('Теперь Вы - лидер лобби');
            } catch (error) {/* */}
            this.dcLeader = newLeader;
        }
        if (this.dcMembers.size) {
            this.updateAppeal();
        }
    }

    public async updateAppeal(appeal?: MessageOptions) {
        await this.initAppeal();
        if (this.appealTimeout || (this.appealMessage.editedTimestamp || this.appealMessage.createdTimestamp) > (Date.now() - parseInt(ENV.MESSAGE_COOLDOWN))) {
            this.appealTimeoutMsg = embeds.appealMsg(this);
            clearTimeout(this.appealTimeout);
            this.appealTimeout = setTimeout(() => (this.appealTimeout = null) || this.updateAppeal(this.appealTimeoutMsg), Date.now() - (this.appealMessage.editedTimestamp || this.appealMessage.createdTimestamp) + 1);
        } else if (!this.appealMessage.deleted) {
            this.appealMessage = await this.appealMessage.edit('', appeal || embeds.appealMsg(this));
        }
    }

    public async handleAction(action: keyof typeof emojiButtons.direct, flag: boolean) {
        if (this[action] === flag) { return; }
        if (action === 'hardplay' && flag && this.minRank === 0) {
            try {
                return this.dcLeader.send(`Нельзя активировать HardPlay в команде состоящей только из \`Unranked\`!`);
            } catch (error) {/* */}
        }
        this[action] = flag;
        await this.save();
        switch (action) {
            case 'close': {
                await this.dcChannel.setUserLimit(flag ? this.dcMembers.size : this.LS.roomSize);
                debug.log(`${this.dcLeader} ${!this.close ? 'открыл' : 'закрыл'} лобби!. ID пати \`${this.id}\``);
                try {
                    this.dcLeader.send(`Лобби ${!this.close ? 'открыто' : 'закрыто'}!`);
                } catch (error) {/* */}
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
                    });
                    debug.log(`${this.dcLeader} ${!this.hardplay ? 'деактивировал' : 'активировал'} HardPlay лобби!. ID пати \`${this.id}\``);
                    try {
                        this.dcLeader.send(`HardPlay лобби ${!this.hardplay ? 'деактивировано' : 'активировано'}!`);
                    } catch (error) {/* */}
                } else {
                    this.dcChannel = await this.dcChannel.edit({
                        name: this.dcChannel.name.replace(/HardPlay /g, ''),
                        permissionOverwrites: this.dcChannel.parent.permissionOverwrites,
                    });
                }
                break;
            }
        }
        await Promise.all([
            this.updateAppeal(),
            this.LS.updateFastAppeal(),
        ]);
    }

    public get minRank() {
        const ranks = this.members.map(m => m.rank);
        return ranks.some(r => r !== 0) ? Math.min(...ranks.filter(r => r !== 0)) : 0;
    }

    public get maxRank() {
        return Math.max(...this.members.map(m => m.rank));
    }

    public get limitRank() {
        return this.minRank === Infinity ? 0 : this.minRank - this.minRank % 4 + 1;
    }

    public get joinAllowed() {
        return !this.close && (this.dcMembers.size < this.dcChannel.userLimit) && !currentlyPlaying.includes(this.status);
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
}

applyMixins(LSRoom, [Lobby]);
