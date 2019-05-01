import { Guild, Lobby, User } from '@r6ru/db';
import { LobbyStoreStatus as LSS } from '@r6ru/types';
import { CategoryChannel, GuildMember, Snowflake, VoiceChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { Sequelize } from 'sequelize-typescript';
import bot from '../bot';
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

export class LobbyStore extends EventEmitter {
    public categoryId: Snowflake;
    public category: CategoryChannel;
    public guild: Guild;
    public type: string;
    public lobbys: Lobby[];
    public voices: VoiceChannel[];
    // public blacklist: GuildMember[] = [];
    public events: Array<Partial<ILobbyStoreEvent>> = [];
    public status: LSS = LSS.LOADING;

    public generateLobby = async (voice: VoiceChannel) => {
        const inv = await voice.createInvite();
        const lobby = new Lobby({
            channel: voice.id,
            initiatedAt,
            invite: inv.url,
            type: this.type,
        }).init({
            dcCategory: this.category,
            dcChannel: voice,
            dcGuild: voice.guild,
            dcInvite: inv,
            dcMembers: [...voice.members.values()],
        });
        await lobby.save();
        await lobby.$set('guild', this.guild);
        await lobby.$set('members', await User.findAll({ where: { id: lobby.dcMembers.map((m) => m.id) } }));
        await lobby.reload({ include: [{all: true}] });
        return lobby;
    }
    public init = async () => {
        this.lobbys = await Promise.all(this.voices.map(this.generateLobby));
        console.log('VOICES', this.voices.length, 'LOBBYS', this.lobbys.length, 'ROOMS RANGE', this.guild.roomsRange);
        this.status = LSS.AVAILABLE;
        console.log('STATUS', LSS[this.status]);

        setInterval(this.watchEvents, 500);
        setInterval(() => this.events.pop(), 1000);
        // setInterval(this.blacklist.pop, 60000);
    }
    public kick = async (member: GuildMember) => {

    }
    public addEvent = async (e: Partial<ILobbyStoreEvent>) => {
        if (this.events.length >= parseInt(ENV.EVENT_QUEUE_LENGTH)) {
            this.events.pop();
        }
        this.events.unshift(e);
    }
    public watchEvents = () => {
        const grouppedByMember = this.events
            // .sort((a, b) => parseInt(a.member.id) - parseInt(b.member.id))
            .reduce((a: IActivityCounter[], b) => {
                const i = a.findIndex((x) => x.id === b.member.id);
                i === -1 ? a.push({ id : b.member.id, times : 1 }) : a[i].times++;
                return a;
            }, []);
        const grouppedByLeave = this.events
        // .sort((a, b) => parseInt(a.member.id) - parseInt(b.member.id))
            .filter((e) => e.type === 'leave')
            .reduce((a: IActivityCounter[], b) => {
                const i = a.findIndex((x) => x.id === b.voice.id);
                i === -1 ? a.push({ id : b.voice.id, times : 1 }) : a[i].times++;
                return a;
            }, []);
        // console.log(grouppedByMember);
        switch (true) {
            case true: {
                break;
            }
            default:
                break;
        }
    }
    public join = async (member: GuildMember, to: VoiceChannel) => {
        console.log('VOICES', this.voices && this.voices.length, 'LOBBYS', this.lobbys && this.lobbys.length);
        await this.waitReady();
        console.log('Awaited');
        this.status = LSS.TRANSACTING;
        if (to.members.size === 1 && this.voices.length <= this.guild.roomsRange[1]) {
            const channelToClone = this.voices[this.voices.length - 1];
            const clonedChannel = await channelToClone.clone({ name: channelToClone.name.replace(/\d+/g, (n) => (parseInt(n) + 1).toString()) }) as VoiceChannel;
            this.voices = [...this.voices, clonedChannel];
            this.lobbys.push(await this.generateLobby(clonedChannel));
        }
        this.addEvent({
            member,
            type: 'join',
            voice: to,
        });
        this.status = LSS.AVAILABLE;
    }
    public leave = async (member: GuildMember, from: VoiceChannel) => {
        console.log('VOICES', this.voices && this.voices.length, 'LOBBYS', this.lobbys && this.lobbys.length);
        await this.waitReady();
        console.log('Awaited');
        this.status = LSS.TRANSACTING;
        if (from.members.size === 0 && this.voices.length >= this.guild.roomsRange[0]) {
            const lobbyToDisable = this.lobbys.find((l) => l.dcChannel === from);
            const k = this.lobbys.findIndex((l) => l.dcChannel === from);
            lobbyToDisable.active = false;
            await lobbyToDisable.save();
            this.lobbys.splice(k, 1);

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
    public internal = async (member: GuildMember, from: VoiceChannel, to: VoiceChannel) => {

    }
    constructor(id: Snowflake, type: string, dbGuild: Guild) {
        super();
        this.categoryId = id;
        this.category = bot.channels.get(this.categoryId) as CategoryChannel;
        this.voices = this.category.children.filter((ch) => ch.type === 'voice').array().sort((a, b) => a.position - b.position) as VoiceChannel[];
        this.type = type;
        this.guild = dbGuild;
        // this.blacklist = [];
        this.events = [];
        this.init();
    }

    private atomicLeave = async () => {

    }
    private atomicJoin = async () => {

    }
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

export async function update() {
    const dbGuilds = await Guild.findAll({ where: { premium: true } }).filter((g) => g.id === 'none'); // .filter((g) => g.id === '216649610511384576');
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
    // console.log(lobbyStores);
}
