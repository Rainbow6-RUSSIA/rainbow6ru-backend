import { BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, IBuildOptions, Model, Table } from 'sequelize-typescript';

import Guild from './Guild';
import User from './User';

import { IngameStatus as IS } from '@r6ru/types';
import { CategoryChannel, Guild as G, GuildMember, Invite, Message, Snowflake, VoiceChannel } from 'discord.js';

interface IOpts {
    dcGuild?: G; // 1
    dcChannel?: VoiceChannel; // 1
    dcCategory?: CategoryChannel; // 1
    dcMembers?: GuildMember[]; // 1
    dcInvite?: Invite;
    dcLeader?: GuildMember;
}

const currentlyPlaying = [IS.CASUAL, IS.RANKED, IS.CUSTOM, IS.NEWCOMER, IS.DISCOVERY];

@Table({schema: 'siegebot', timestamps: true})
export default class Lobby extends Model<Lobby> {
    @BeforeCreate
    public static initLog(instance: Lobby) {
        instance.log = [];
    }

    @BeforeUpdate
    public static addLog(instance: Lobby) {
        if (instance.members) {
            instance.log = [...instance.log, ...instance.members.map(u => u.id).filter(u => !instance.log.includes(u))];
        }
    }

    @Column
    public description: string;

    @Default(true)
    @Column
    public active: boolean;

    @Default(true)
    @Column
    public open: boolean;

    @Default(false)
    @Column
    public hardplay: boolean;

    @Column
    public invite: string;
    public dcInvite: Invite;

    public appealMessage: Message;
    public status: IS;

    @Column
    public type: string;
    public dcCategory: CategoryChannel;

    @Column
    public channel: Snowflake;
    public dcChannel: VoiceChannel;

    @ForeignKey(() => Guild)
    @Column
    public guildId: Snowflake;

    @BelongsTo(() => Guild)
    public guild: Guild;
    public dcGuild: G;

    public dcLeader: GuildMember;

    @HasMany(() => User)
    public members: User[];
    get dcMembers() {
        return this.dcChannel.members;
    }

    @Default([])
    @Column(DataType.ARRAY(DataType.STRING))
    public log: Snowflake[];

    @Column
    public initiatedAt: Date;

    public init(addArgs: IOpts) {
        this.dcGuild = addArgs.dcGuild;
        this.dcCategory = addArgs.dcCategory;
        this.dcChannel = addArgs.dcChannel;
        // this.dcMembers = addArgs.dcMembers;
        this.dcInvite = addArgs.dcInvite;
        this.dcLeader = addArgs.dcLeader;
        return this;
    }

    public get minRank(): number {
        return Math.min(...this.members.map(m => m.rank));
    }

    public get maxRank(): number {
        return Math.max(...this.members.map(m => m.rank));
    }

    public get limitRank(): number {
        return this.minRank === Infinity ? 0 : this.minRank - this.minRank % 4 + 1;
    }

    public get joinAllowed(): boolean {
        return this.open && (this.dcChannel.members.size < this.dcChannel.userLimit) && !currentlyPlaying.includes(this.status);
    }
}
