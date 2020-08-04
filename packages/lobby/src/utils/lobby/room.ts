import { Lobby, User } from '@r6ru/db';
import { currentlyPlaying, EmojiButtons, IngameStatus as IS } from '@r6ru/types';
import { CategoryChannel, Collection, Guild, GuildMember, Invite, Message, MessageReaction, ReactionCollector, User as U, VoiceChannel } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { LobbyStore, lobbyStores, lobbyStoresRooms } from '.';
import { debug } from '../..';
import { detectIngameStatus, start } from '../../bot/listeners/presenceUpdate';
import { debounce } from '../decorators/debounce';
import ReverseThrottle from '../decorators/reverse_throttle';
import Throttle from '../decorators/throttle';
import embeds from '../embeds';
import ENV from '../env';
import { applyMixins } from '../mixin';

export class LSRoom extends Lobby {
    public LS: LobbyStore;

    public appealMessage: Message;

    public reactionBarCollector: ReactionCollector;

    public dcInvite: Invite;
    public dcCategory: CategoryChannel;
    public dcChannel: VoiceChannel;
    public dcGuild: Guild;
    public dcLeader: GuildMember;

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
    }

    public async init() {
        try {
            await this.dcChannel.edit({
                name:  this.LS.settings.roomName?.replace(/{{n}}/, (this.dcChannel.position + 1).toString())
                    || this.dcChannel.name.replace(/HardPlay /g, '').replace(/#\d+/g, `#${this.dcChannel.position + 1}`),
                permissionOverwrites: this.dcChannel.parent.permissionOverwrites,
                userLimit: this.LS.settings.roomSize,
            }, 'инициализация комнаты');
        } catch (error) {
            console.log('FAIL ON INIT', error);
            return null;
        }

        const previousLobby = await Lobby.findOne({ where: { channel: this.dcChannel.id }, order: [['initiatedAt', 'DESC']] });
        this.description = previousLobby?.description;

        await this.save();
        await this.$set('guild', this.dcChannel.guild.id);
        await this.$set('members', await User.findAll({ where: { id: this.dcMembers.map(m => m.id) } }));
        await this.reload({ include: [{all: true}] });

        if (this.dcLeader?.user) {
            await this.initAppeal();
        }
        if (this.categoryVoices.lastKey() === this.channel) {
            await this.initInvite();
        }
        if (this.dcMembers.size) {
            this.handleStatus();
        }

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
            const filter = (reaction: MessageReaction, user: U) => !user.bot && $enum(EmojiButtons).isValue(reaction.emoji.name) && ((this.dcLeader && this.dcLeader.id) === user.id || this.dcGuild.member(user).hasPermission('MANAGE_ROLES'));
            this.reactionBarCollector = this.appealMessage.createReactionCollector(filter, {dispose: true});
            (async () => {
                for (const r of $enum(EmojiButtons).values()) {
                    await this.appealMessage.react(r);
                }
            })();
            const barHandler = (flag: boolean) =>
                (reaction: MessageReaction, user: U) =>
                    this.handleAction($enum(EmojiButtons).asValueOrThrow(reaction.emoji.name), flag);
            this.reactionBarCollector.on('collect', barHandler(true));
            this.reactionBarCollector.on('remove', barHandler(false));
        }
        return this.appealMessage;
    }

    public async deactivate() {
        // console.log('DEACTIVATE', this.dcChannel.name);
        lobbyStoresRooms.delete(this.channel);
        this.active = false;
        await this.save();
        await this.destroyAppeal();
    }

    public async join(member: GuildMember, internal: boolean) {

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

        if (!this.dcLeader) {
            this.dcLeader = member;
        }

        if (this.appealMessage || this.dcMembers.size >= this.LS.settings.roomSize) {
            await this.updateAppeal();
        }
        // await this.refreshIngameStatus(this);
        // console.log(`${member.user.tag} JOINED ${this.dcChannel.name}`);
    }

    public async leave(member: GuildMember, internal: boolean) {
        await this.$remove('members', member.id);
        await this.reload({include: [{all: true}]});

        if (!this.dcMembers.size) {
            this.dcLeader = null;
            await this.destroyAppeal();
        }

        if (this.close) {
            this.handleClose(false);
            this.dcChannel = await this.dcChannel.setUserLimit(this.LS.settings.roomSize);
        }

        if (member.id === this.dcLeader?.id) {
            const newLeader = this.dcMembers.random();
            this.handleHardplay(false);
            try {
                newLeader.send('Теперь Вы - лидер лобби');
            } catch (error) {/* */}
            this.dcLeader = newLeader;
        }

        await this.updateAppeal();
        // console.log(`${member.user.tag} LEFT ${this.dcChannel.name}`);
    }

    @Throttle(2000)
    public async updateAppeal() {
        if (!this.dcMembers.size) { return; }
        await this.initAppeal();
        if (!this.appealMessage.deleted) {
            try {
                this.appealMessage = await this.appealMessage.edit('', embeds.appealMsg(this));
            } catch (error) {/* */}
            // console.log(`APPEAL UPDATED ${this.dcChannel.name}`);
        }
    }

    public async destroyAppeal() {
        if (this.appealMessage && !this.appealMessage.deleted) {
            try {
                this.appealMessage = await this.appealMessage.delete();
            } catch (error) {/* */}
        }
    }

    public async moveTo(type: string | IS) {
        if (typeof type === 'number') {
            const category = lobbyStores.find(ls => ls.settings.allowedModes?.includes(type))?.category;
            if (!category) throw new ReferenceError();
            await this.dcChannel.setParent(category, { lockPermissions: true, reason: 'перемещение в нужную категорию'});
        } else if (typeof type === 'string') {
            const category = lobbyStores.find(ls => ls.settings.type === type)?.category;
            if (!category) throw new ReferenceError();
            await this.dcChannel.setParent(category, { lockPermissions: true, reason: 'перемещение в нужную категорию вручную'});
        }
        return this
    }

    // ACTION HANDLING

    public async handleAction(action: EmojiButtons, flag: boolean) {
        switch (action) {
            case EmojiButtons.CLOSE: return debounce(this.handleClose(flag), 1500);
            case EmojiButtons.HARDPLAY: return debounce(this.handleHardplay(flag), 1500);
        }
    }

    public async handleClose(flag: boolean) {
        if (this.close === flag) { return; }
        this.close = !this.close;
        await this.save();

        await this.dcChannel.setUserLimit(flag ? this.dcMembers.size : this.LS.settings.roomSize);
        debug.log(`${this.dcLeader} ${!this.close ? 'открыл' : 'закрыл'} лобби!. ID пати \`${this.id}\``);
        try {
            this.dcLeader.send(`Лобби ${!this.close ? 'открыто' : 'закрыто'}!`);
        } catch (error) {/* */}

        await Promise.all([
            this.updateAppeal(),
            this.LS.updateFastAppeal(),
        ]);
    }

    public async handleHardplay(flag: boolean) {
        if (flag && this.minRank === 0) {
            try {
                await this.dcLeader.send(`HardPlay для команды состоящей только из \`Unranked\` бесполезен, внесены только косметические изменения!`);
            } catch (error) {/* */}
        }

        if (this.hardplay === flag) { return; }
        this.hardplay = !this.hardplay;
        await this.save();

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

        await Promise.all([
            this.updateAppeal(),
            this.LS.updateFastAppeal(),
        ]);
    }

    public handleStatus() {
        const statusColl = new Collection<IS, number>();
        this.dcMembers.map(m => detectIngameStatus(m.presence)).map(s => statusColl.set(s, (statusColl.get(s) || 0) + 1));
        statusColl.sort((a, b, ak, bk) => (b - a) || (bk - ak)); // sort by quantity otherwise sort by mode from actual mode to OTHER
        // if (statusColl.size <= 2 && statusColl.has(IS.OTHER)) {
        //     Object.values(room.LS.guild.lobbySettings);
        //     // move when playing incorrect mode
        // }
        return this.processStatus(statusColl);
    }

    @ReverseThrottle(5000)
    private async processStatus(statusColl: Collection<IS, number>) {
        if (!this || this.status === IS.LOADING || !this.dcMembers.size) { return; }
        const prevStatus = this.status;
        const nextStatus = statusColl.firstKey();
        if (prevStatus !== nextStatus) {
            // console.log(IS[prevStatus], '-->', IS[nextStatus], statusColl);
            if (![prevStatus, nextStatus].includes(IS.OTHER)) {
                if (start.some(t => t[0] === prevStatus && t[1] === nextStatus)) {
                    debug.log(`<@${this.members.map(m => m.id).join('>, <@')}> начали играть (\`${IS[prevStatus]} --> ${IS[nextStatus]}\`). ID пати \`${this.id}\``);
                }

                if (start.some(t => t[1] === prevStatus) && nextStatus === IS.MENU) {
                    debug.log(`<@${this.members.map(m => m.id).join('>, <@')}> закончили играть (\`${IS[prevStatus]} --> ${IS[nextStatus]}\`). ID пати \`${this.id}\``);
                }

                if (prevStatus === IS.RANKED && nextStatus === IS.MENU) {
                    this.members.map(m => {
                        m.rankUpdatedAt = new Date('2000');
                        m.save();
                    });
                }
            }

            this.status = typeof nextStatus === 'number' ? nextStatus : IS.OTHER;
            this.updateAppeal();
            this.LS.updateFastAppeal();

            return true;
        } else {
            return false;
        }
    }

    // GETTERS

    get minRank() {
        const ranks = this.members.map(m => m.rank);
        return ranks.some(r => r !== 0) ? Math.min(...ranks.filter(r => r !== 0)) : 0;
    }

    get maxRank() {
        return Math.max(...this.members.map(m => m.rank));
    }

    get limitRank() {
        return this.minRank === Infinity ? 0 : this.minRank - this.minRank % 4 + 1;
    }

    get joinAllowed() {
        return !this.close && (this.dcMembers.size < this.dcChannel.userLimit) && !currentlyPlaying.includes(this.status);
    }

    get dcMembers() {
        return this.dcChannel.members;
    }

    get leader() {
        return this.members.find(m => m.id === this.dcLeader.id);
    }

    get categoryVoices() {
        return this.dcCategory.children.filter(ch => ch instanceof VoiceChannel && !ch.deleted).sort((a, b) => a.position - b.position) as Collection<string, VoiceChannel>;
    }
}

applyMixins(LSRoom, [Lobby]);
