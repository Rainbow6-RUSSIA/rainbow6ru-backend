import { BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, IBuildOptions, Model, Table } from 'sequelize-typescript';

import Guild from './Guild';
import User from './User';

import { CategoryChannel, Guild as G, GuildMember, Invite, Snowflake, VoiceChannel } from 'discord.js';

interface IOpts {
    dcGuild?: G; // 1
    dcChannel?: VoiceChannel; // 1
    dcCategory?: CategoryChannel; // 1
    dcMembers?: GuildMember[]; // 1
    dcInvite?: Invite;
}

@Table({schema: 'siegebot', timestamps: true})
export default class Lobby extends Model<Lobby> {
    @BeforeCreate
    public static initLog(instance: Lobby) {
        instance.log = [];
    }

    @BeforeUpdate
    public static addLog(instance: Lobby) {
        if (instance.members) {
            instance.log = [...instance.log, ...instance.members.map((u) => u.id).filter((u) => !instance.log.includes(u))];
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

    @Column
    public invite: string;
    public dcInvite: Invite;

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

    @HasOne(() => User)
    public leader: User;

    @HasMany(() => User)
    public members: User[];
    public dcMembers: GuildMember[];

    @Default([])
    @Column(DataType.ARRAY(DataType.STRING))
    public log: Snowflake[];

    @Column
    public initiatedAt: Date;

    public init(addArgs: IOpts) {
        this.dcGuild = addArgs.dcGuild;
        this.dcCategory = addArgs.dcCategory;
        this.dcChannel = addArgs.dcChannel;
        this.dcMembers = addArgs.dcMembers;
        this.dcInvite = addArgs.dcInvite;
        return this;
    }
}
