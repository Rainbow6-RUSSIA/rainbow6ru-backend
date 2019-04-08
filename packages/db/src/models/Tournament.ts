// import { MATCH_TYPE } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { AllowNull, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';
// import Team from './Team';
// import User from './User';
// import Vote from './Vote';
import Guild from './Guild';
import MapR6 from './MapR6';
import Match from './Match';
import Pool from './Pool';

@Table({schema: 'streambot'})
export default class Tournament extends Model<Tournament> {
    public name: string;

    public sponsors: string[];

    public sponsorsBanners: string[];

    @ForeignKey(() => Guild)
    @Column
    public guildId: Snowflake;

    @BelongsTo(() => Guild)
    public guild: Guild;

    @HasMany(() => Match)
    public matches: Match[];

    @BelongsToMany(() => MapR6, () => Pool)
    public pool: MapR6[];
}
