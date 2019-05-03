import { Guild, Lobby, User } from '@r6ru/db';
import { IngameStatus, LobbyStoreStatus, LobbyStoreStatus as LSS, ONLINE_TRACKER, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS, RANK_COLORS, VERIFICATION_LEVEL } from '@r6ru/types';
import { TryCatch } from '@r6ru/utils';
import { CategoryChannel, GuildMember, MessageEmbedOptions, Presence, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { Sequelize } from 'sequelize-typescript';
import { debug } from '..';
import bot from '../bot';
import embeds from './embeds';
import ENV from './env';

const { Op } = Sequelize;
const initiatedAt = new Date();

interface ILobbyStoreEvent {
    type: 'join' | 'leave' | 'move';
    user: User;
    member: GuildMember;
    voice: VoiceChannel;
    lobby: Lobby;
}

interface IActivityCounter {
    id: string;
    times: number;
}

export class LobbyStore {
    public static detectIngameStatus = (presence: Presence): IngameStatus => {
        const { activity } = presence;
        if (activity && activity.applicationID === R6_PRESENCE_ID) {
            // console.log(presence.user.tag, '|', activity.details.normalize(), '|', IngameStatus[i]);
            return R6_PRESENCE_REGEXPS.findIndex((ar) => ar.some((r) => r.test(activity.details.normalize())));
        } else {
            // console.log('NO ACTIVITY');
            return IngameStatus.OTHER;
        }
    }

    public categoryId: Snowflake;
    public category: CategoryChannel;
    public lfgChannel: TextChannel;
    public lfgChannelId: Snowflake;
    public guild: Guild;
    public type: string;
    public lobbies: Lobby[];
    public voices: VoiceChannel[];
    // public blacklist: GuildMember[] = [];
    public events: Array<Partial<ILobbyStoreEvent>> = [];
    public status: LSS = LSS.LOADING;

    public constructor(id: Snowflake, type: string, dbGuild: Guild) {
        (async () => {
            this.guild = dbGuild;
            this.events = [];
            this.categoryId = id;
            this.category = await bot.channels.fetch(this.categoryId) as CategoryChannel;
            // this.category = bot.channels.get(this.categoryId) as CategoryChannel;
            this.voices = this.category.children.filter((ch) => ch.type === 'voice').array().sort((a, b) => a.position - b.position) as VoiceChannel[];
            this.type = type;
            this.lfgChannelId = dbGuild.lfgChannels[this.type];
            this.lfgChannel = await bot.channels.fetch(this.lfgChannelId) as TextChannel;
            // this.lfgChannel = bot.channels.get(this.lfgChannelId) as TextChannel;
            if (this.lfgChannel.type === 'text') {
                this.init();
            }
        })();
    }

    @TryCatch(debug)
    public init = async () => {
        this.lobbies = await Promise.all(this.voices.map(this.generateLobby));
        console.log(this.lfgChannel.guild.name, 'VOICES', this.voices.length, 'LOBBIES', this.lobbies.length, 'ROOMS RANGE', this.guild.roomsRange);
        this.status = LSS.AVAILABLE;
        console.log(this.lfgChannel.guild.name, 'STATUS', LSS[this.status]);

        setInterval(this.watchEvents, 500);
        setInterval(() => this.events.pop(), 60000);
        // setInterval(this.blacklist.pop, 60000);
    }

    @TryCatch(debug)
    public kick = async (member: GuildMember) => {
        console.log('soon™');
    }

    @TryCatch(debug)
    public join = async (member: GuildMember, to: VoiceChannel) => {
        // debug.log(`VOICES ${this.voices && this.voices.length}, LOBBIES ${this.lobbies && this.lobbies.length}`);
        await this.waitReady();
        this.status = LSS.TRANSACTING;
        if (to.members.size === 1 && this.voices.length <= this.guild.roomsRange[1]) {
            const lobby = this.lobbies.find((l) => l.dcChannel.id === to.id);
            lobby.dcLeader = member;
            const channelToClone = this.voices[this.voices.length - 1];
            const clonedChannel = await channelToClone.clone({ name: channelToClone.name.replace(/\d+/g, (n) => (parseInt(n) + 1).toString()) }) as VoiceChannel;
            this.voices = [...this.voices, clonedChannel];
            this.lobbies.push(await this.generateLobby(clonedChannel));
        }
        this.addEvent({
            member,
            type: 'join',
            voice: to,
        });
        await this.atomicJoin(member, to);
        this.status = LSS.AVAILABLE;
    }

    @TryCatch(debug)
    public leave = async (member: GuildMember, from: VoiceChannel) => {
        // debug.log(`VOICES ${this.voices && this.voices.length}, LOBBIES ${this.lobbies && this.lobbies.length}`);
        await this.waitReady();
        // console.log('Awaited');
        this.status = LSS.TRANSACTING;
        await this.atomicLeave(member, from);
        if (from.members.size === 0 && this.voices.length >= this.guild.roomsRange[0]) {
            const lobbyToDisable = this.lobbies.find((l) => l.dcChannel === from);
            const k = this.lobbies.findIndex((l) => l.dcChannel === from);
            lobbyToDisable.active = false;
            await lobbyToDisable.save();
            this.lobbies.splice(k, 1);

            const j = this.voices.findIndex((v) => v === from);
            this.voices.splice(j, 1);
            await from.delete();
            await Promise.all(this.voices.sort((a, b) => a.position - b.position).map((v, i) => v.setName(v.name.replace(/\d+/g, (_) => (i + 1).toString()))));
        }
        this.addEvent({
            member,
            type: 'leave',
            voice: from,
        });
        this.status = LSS.AVAILABLE;
    }

    @TryCatch(debug)
    public internal = async (member: GuildMember, from: VoiceChannel, to: VoiceChannel) => {
        await this.atomicLeave(member, from);
        await this.atomicJoin(member, to);
    }

    @TryCatch(debug)
    public reportIngameStatus = async (member: GuildMember, status: IngameStatus) => {
        // console.log(member.user.tag, 'NOW', IngameStatus[status]);
    }

    // @TryCatch(debug)
    // public generateAppealEmbed = (lobby: Lobby): MessageEmbedOptions => ()

    @TryCatch(debug)
    private updateAppealMsg = async (lobby: Lobby) => {

        if (lobby.appealMessage) {
            try {
                lobby.appealMessage.edit('@here', { embed: embeds.appealMsg(lobby) });
            } catch (err) {
                this.lfgChannel.send('@here', { embed: embeds.appealMsg(lobby) });
            }
        }
    }

    @TryCatch(debug)
    private addEvent = async (e: Partial<ILobbyStoreEvent>) => {
        if (this.events.length >= parseInt(ENV.EVENT_QUEUE_LENGTH)) {
            this.events.pop();
        }
        this.events.unshift(e);
    }

    @TryCatch(debug)
    private generateLobby = async (voice: VoiceChannel) => {
        // const inv = await voice.createInvite();
        const members = [...voice.members.values()];
        const lobby = new Lobby({
            channel: voice.id,
            initiatedAt,
            // invite: inv.url,
            type: this.type,
        }).init({
            dcCategory: this.category,
            dcChannel: voice,
            dcGuild: voice.guild,
            // dcInvite: inv,
            dcLeader: members[Math.floor(Math.random() * members.length)],
            dcMembers: members,
        });
        await lobby.save();
        await lobby.$set('guild', this.guild);
        await lobby.$set('members', await User.findAll({ where: { id: lobby.dcMembers.map((m) => m.id) } }));
        await lobby.reload({ include: [{all: true}] });
        return lobby;
    }

    @TryCatch(debug)
    private watchEvents = () => {
        const grouppedByMember = this.events
            .reduce((a: IActivityCounter[], b) => {
                const i = a.findIndex((x) => x.id === b.member.id);
                i === -1 ? a.push({ id : b.member.id, times : 1 }) : a[i].times++;
                return a;
            }, []);
        const grouppedByLeave = this.events
            .filter((e) => e.type === 'leave')
            .reduce((a: IActivityCounter[], b) => {
                const i = a.findIndex((x) => x.id === b.voice.id);
                i === -1 ? a.push({ id : b.voice.id, times : 1 }) : a[i].times++;
                return a;
            }, []);
        switch (true) {
            case true: {
                break;
            }
            default:
                break;
        }
    }

    @TryCatch(debug)
    private atomicLeave = async (member: GuildMember, from: VoiceChannel) => {
        const lobby = this.lobbies.find((l) => l.dcChannel.id === from.id);
        await lobby.$remove('members', await User.findByPk(member.id));
        await lobby.reload({include: [{all: true}]});
        lobby.dcMembers = lobby.dcMembers.filter((m) => m.id !== member.id);
        if (member.id === lobby.dcLeader.id && from.members.size !== 0) {
            console.log(lobby.dcLeader.user.tag, lobby.log);
            lobby.log = [];
            await lobby.save();
            const newLeader = lobby.dcMembers[Math.floor(Math.random() * lobby.dcMembers.length)];
            newLeader.send('теперь Вы - лидер лобби');
            lobby.dcLeader = newLeader;
            console.log('leader left');
        }
        if (lobby.dcMembers.length) {
            this.updateAppealMsg(lobby);
        } else {
            await (lobby.appealMessage && lobby.appealMessage.delete());
        }
    }

    @TryCatch(debug)
    private atomicJoin = async (member: GuildMember, to: VoiceChannel) => {
        const lobby = this.lobbies.find((l) => l.dcChannel.id === to.id);
        await lobby.$add('members', await User.findByPk(member.id));
        await lobby.reload({include: [{all: true}]});
        lobby.dcMembers.push(member);
        this.updateAppealMsg(lobby);
    }

    @TryCatch(debug)
    private waitReady = async () => {
        return new Promise((resolve) => {
            const waiter = () => {
                if (this.status === LSS.AVAILABLE) { return resolve(); }
                setTimeout(waiter, 50);
            };
            waiter();
        });
    }
}

export const lobbyStores: Map<Snowflake, LobbyStore> = new Map();

export async function initLobbyStores() {
    if (ENV.ENABLE_LOBBIES !== 'true') {
        return debug.warn('Lobbies disabled');
    } else {
        debug.warn('Lobbies enabled');
    }
    const dbGuilds = await Guild.findAll({ where: { premium: true } });
    dbGuilds.map((g) => {
        Object.entries(g.voiceCategories).map((ent) => lobbyStores.set(ent[1], new LobbyStore(ent[1], ent[0], g)));
    });
    const lobbies = await Lobby.findAll({
        where: {
            [Op.and]: [
                {initiatedAt: {[Op.lt]: initiatedAt}},
                {active: true},
            ],
        },
    });
    await Promise.all(lobbies.map((l) => {
        l.active = false;
        return l.save();
    }));
}
