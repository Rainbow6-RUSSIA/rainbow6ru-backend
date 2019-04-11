import { BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';

import Guild from './Guild';
import User from './User';

import { Snowflake } from 'discord.js';

@Table({schema: 'siegebot', timestamps: true})
export default class Lobby extends Model<Lobby> {
    @BeforeCreate
    public static initLog(instance: Lobby) {
        instance.log = [instance.leader.id, ...instance.users.map((u) => u.id)];
    }

    @BeforeUpdate
    public static addLog(instance: Lobby) {
        instance.log = [...instance.log, ...instance.users.map((u) => u.id).filter((u) => !instance.log.includes(u))];
    }

    @Column
    public description: string;

    @Column
    public active: boolean;

    @Column
    public open: boolean;

    @Column
    public channel: Snowflake;

    @ForeignKey(() => Guild)
    @Column
    public guildId: Snowflake;

    @BelongsTo(() => Guild)
    public guild: Guild;

    @HasOne(() => User)
    public leader: User;

    @HasMany(() => User)
    public users: User[];

    @Column(DataType.ARRAY(DataType.STRING))
    public log: Snowflake[];

}
