import { Guild, Lobby, User } from '@r6ru/db';
import { IngameStatus, LobbyStoreStatus, LobbyStoreStatus as LSS, ONLINE_TRACKER, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS, RANK_COLORS, VERIFICATION_LEVEL } from '@r6ru/types';
// import { TryCatch } from '@r6ru/utils';
import { CategoryChannel, GuildMember, MessageEmbedOptions, Presence, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import { EventEmitter } from 'events';
import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import * as uuid from 'uuid/v4';
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
            return R6_PRESENCE_REGEXPS.findIndex((ar) => ar.some((r) => r.test(activity.details)));
        } else {
            // console.log('NOT SIEGE', activity);
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
    public promiseQueue = [];

    public constructor(id: Snowflake, type: string, dbGuild: Guild) {
        (async () => {
            this.guild = dbGuild;
            this.events = [];
            this.categoryId = id;
            this.category = await bot.channels.fetch(this.categoryId) as CategoryChannel;
            // this.category = bot.channels.get(this.categoryId) as CategoryChannel;
            this.type = type;
            this.lfgChannelId = dbGuild.lfgChannels[this.type];
            this.lfgChannel = await bot.channels.fetch(this.lfgChannelId) as TextChannel;
            // this.lfgChannel = bot.channels.get(this.lfgChannelId) as TextChannel;
            if (this.lfgChannel.type === 'text') {
                const voices = (this.category.children.filter((ch) => ch.type === 'voice').array() as VoiceChannel[]).sort((a, b) => b.members.size - a.members.size); // .sort((a, b) => a.position - b.position) as VoiceChannel[];
                const cond = (v, i, a) => i >= this.guild.roomsRange[0] && !v.members.size && i !== a.length;
                const toDelete = voices.filter((...args) => cond(...args));
                const rest = voices.filter((...args) => !cond(...args));
                if (rest[0].members.size !== 0) {
                    rest.push(toDelete.pop());
                }
                await Promise.all(toDelete.map((v) => v.delete()));
                this.voices = rest.sort((a, b) => a.position - b.position);
                await this.syncChannels();
                this.lobbies = await Promise.all(this.voices.map(this.generateLobby));
                console.log(this.lfgChannel.guild.name, 'VOICES', this.voices.length, 'LOBBIES', this.lobbies.length, 'ROOMS RANGE', this.guild.roomsRange);
                this.status = LSS.AVAILABLE;
                console.log(this.lfgChannel.guild.name, 'STATUS', LSS[this.status]);

                setInterval(this.watchEvents, 500);
                setInterval(() => this.events.pop(), 60000);
    }
        })();
    }

    public syncChannels = () => Promise.all(this.voices.sort((a, b) => a.position - b.position).map((v, i) => v.setName(v.name.replace(/\d+/g, (_) => (i + 1).toString()))));

    public async kick(member: GuildMember) {
        console.log('soon™');
    }

    @Atomic
    public async join(member: GuildMember, to: VoiceChannel) {
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

    @Atomic
    public async leave(member: GuildMember, from: VoiceChannel) {
        this.status = LSS.TRANSACTING;
        await this.atomicLeave(member, from);
        if (from.members.size === 0 && this.voices.length > this.guild.roomsRange[0]) {
            const lobbyToDisable = this.lobbies.find((l) => l.dcChannel === from);
            const k = this.lobbies.findIndex((l) => l.dcChannel === from);
            lobbyToDisable.active = false;
            await lobbyToDisable.save();
            this.lobbies.splice(k, 1);

            const j = this.voices.findIndex((v) => v === from);
            this.voices.splice(j, 1);
            await from.delete();
            await this.syncChannels();
        }
        this.addEvent({
            member,
            type: 'leave',
            voice: from,
        });
        this.status = LSS.AVAILABLE;
    }

    @Atomic
    public async internal(member: GuildMember, from: VoiceChannel, to: VoiceChannel) {
        this.status = LSS.TRANSACTING;
        await this.atomicLeave(member, from);
        await this.atomicJoin(member, to);
        this.status = LSS.AVAILABLE;
    }

    public refreshIngameStatus = async (lobby: Lobby) => {
        const statuses = lobby.dcChannel.members.array().map((m) => LobbyStore.detectIngameStatus(m.presence)).filter((s) => s !== IngameStatus.OTHER);
        statuses.unshift(IngameStatus.OTHER);
        console.log(statuses);
        lobby.status = lobby.status = statuses.reduce((acc, el) => {
            acc.k[el] = acc.k[el] ? acc.k[el] + 1 : 1;
            acc.max = acc.max ? acc.max < acc.k[el] ? el : acc.max : el;
            return acc;
          }, { k: {}, max: null }).max;
    }

    public reportIngameStatus = async (member: GuildMember, status: IngameStatus) => {
        console.log(member.user.tag, IngameStatus[status]);
        const lobby = this.lobbies.find((l) => l.dcChannel.id === member.voice.channelID);
        const s = lobby.status;
        await this.refreshIngameStatus(lobby);
        if (lobby.status !== s) {
            this.updateAppealMsg(lobby);
        }
    }

    private updateAppealMsg = async (lobby: Lobby) => {

        if (lobby.appealMessage) {
            try {
                lobby.appealMessage.edit('@here', { embed: embeds.appealMsg(lobby) });
            } catch (err) {
                this.lfgChannel.send('@here', { embed: embeds.appealMsg(lobby) });
            }
        }
    }

    private addEvent = async (e: Partial<ILobbyStoreEvent>) => {
        if (this.events.length >= parseInt(ENV.EVENT_QUEUE_LENGTH)) {
            this.events.pop();
        }
        this.events.unshift(e);
    }

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

    private atomicLeave = async (member: GuildMember, from: VoiceChannel) => {
        const lobby = this.lobbies.find((l) => l.dcChannel.id === from.id);
        await lobby.$remove('members', await User.findByPk(member.id));
        await lobby.reload({include: [{all: true}]});
        lobby.dcMembers = lobby.dcMembers.filter((m) => m.id !== member.id);
        if (!lobby.dcMembers.length) {
            lobby.dcLeader = null;
        }
        if (from.members.size !== 0 && member.id === lobby.dcLeader.id) {
            console.log(lobby.dcLeader.user.tag, lobby.log);
            lobby.log = [];
            await lobby.save();
            const newLeader = lobby.dcMembers[Math.floor(Math.random() * lobby.dcMembers.length)];
            newLeader.send('теперь Вы - лидер лобби');
            lobby.dcLeader = newLeader;
            console.log('leader left');
        }
        if (lobby.dcMembers.length) {
            await this.refreshIngameStatus(lobby);
            await this.updateAppealMsg(lobby);
        } else {
            await (lobby.appealMessage && !lobby.appealMessage.deleted && lobby.appealMessage.delete());
        }
    }

    private atomicJoin = async (member: GuildMember, to: VoiceChannel) => {
        const lobby = this.lobbies.find((l) => l.dcChannel.id === to.id);
        await lobby.$add('members', await User.findByPk(member.id));
        await lobby.reload({include: [{all: true}]});
        if (!lobby.dcLeader) {
            lobby.dcLeader = member;
        }
        lobby.dcMembers.push(member);
        await this.refreshIngameStatus(lobby);
        await this.updateAppealMsg(lobby);
    }

    private waitReady = async () => {
        return new Promise((resolve) => {
            const waiter = () => {
                if (!this.promiseQueue.length && this.status === LSS.AVAILABLE) { return resolve(); }
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

function Atomic(target: LobbyStore, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
    const method = propertyDesciptor.value;

    propertyDesciptor.value = async function(...args: any[]) {
        try {
            // console.log('before');
            await this.waitReady();
            const id = uuid();
            this.promiseQueue.push(id);
            const result = await method.apply(this, args);
            this.promiseQueue = this.promiseQueue.filter((i) => i !== id);
            // console.log('after');
            return result;
        } catch (err) {
            debug.error(err);
        }
    };
    return propertyDesciptor;
}
