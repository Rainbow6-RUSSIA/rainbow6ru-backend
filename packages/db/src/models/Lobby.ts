import { BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';

import Guild from './Guild';
import User from './User';

import { IngameStatus as IS } from '@r6ru/types';
import { CategoryChannel, Guild as G, GuildMember, Invite, Message, Snowflake, VoiceChannel } from 'discord.js';

@Table({
    schema: 'siegebot',
    timestamps: true,
    tableName: 'Lobby'
})
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

    @Default(false)
    @Column
    public close: boolean;

    @Default(false)
    @Column
    public hardplay: boolean;

    @Column
    public invite: string;

    @Default(IS.OTHER)
    @Column
    public status: IS;

    @Column
    public type: string;

    @Column
    public channel: Snowflake;

    @ForeignKey(() => Guild)
    @Column
    public guildId: Snowflake;

    @BelongsTo(() => Guild)
    public guild: Guild;

    @HasMany(() => User)
    public members: User[];

    @Default([])
    @Column(DataType.ARRAY(DataType.STRING))
    public log: Snowflake[];

    @Column
    public initiatedAt: Date;
}
