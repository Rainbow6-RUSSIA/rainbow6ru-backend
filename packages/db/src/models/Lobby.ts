import { BelongsTo, Column, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';

import Guild from './Guild';
import User from './User';

import { Snowflake } from 'discord.js';

@Table({schema: 'siegebot'})
export default class Lobby extends Model<Lobby> {
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
}
