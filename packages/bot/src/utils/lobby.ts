import { Guild, Lobby, User } from '@r6ru/db';
import { CategoryChannel, Snowflake, VoiceChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { Sequelize } from 'sequelize-typescript';
import bot from '../bot';

const { Op } = Sequelize;
const initiatedAt = new Date();

export class LobbyStore extends EventEmitter {
    public categoryId: Snowflake;
    public category: CategoryChannel;
    public guild: Guild;
    public type: string;
    public lobbys: Lobby[];
    public voices: VoiceChannel[];
    public async init() {
        this.lobbys = await Promise.all(
            this.voices.map(async (v) => {
                const inv = await v.createInvite();
                return new Lobby({
                    channel: v.id,
                    initiatedAt,
                    invite: inv.url,
                    type: this.type,
                }).init({
                    dcCategory: this.category,
                    dcChannel: v,
                    dcGuild: v.guild,
                    dcInvite: inv,
                    dcMembers: [...v.members.values()],
                });
            }));
        await Promise.all(this.lobbys.map(async (l) => {
            await l.save();
            await l.$set('guild', this.guild);
            await l.$set('members', await User.findAll({ where: { id: l.dcMembers.map((m) => m.id) } }));
            await l.reload({ include: [{all: true}] });
        }));
        // this.lobbys.map((l) => console.log(l.dataValues));
    }
    constructor(id: Snowflake, type: string, dbGuild: Guild) {
        super();
        this.categoryId = id;
        this.category = bot.channels.get(this.categoryId) as CategoryChannel;
        this.voices = this.category.children.filter((ch) => ch.type === 'voice').array().sort((a, b) => a.position - b.position) as VoiceChannel[];
        this.type = type;
        this.guild = dbGuild;
        this.init();
    }
}

export const lobbyStores: Map<Snowflake, LobbyStore> = new Map();

export async function update() {
    const dbGuilds = await Guild.findAll({ where: { premium: true } }).filter((g) => g.id === 'none');
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
    console.log(lobbyStores);
}
