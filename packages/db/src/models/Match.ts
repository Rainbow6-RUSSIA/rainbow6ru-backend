import { MATCH_TYPE } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { AllowNull, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';
import MapR6 from './MapR6';
import Pool from './Pool';
import Team from './Team';
import TeamMatch from './TeamMatch';
import User from './User';
import Vote from './Vote';

@Table({schema: 'streambot'})
export default class Match extends Model<Match> {
    @ForeignKey(() => User)
    public creatorId: string;

    @BelongsTo(() => User)
    public creator: User;

    @Column(DataType.STRING(5))
    public matchType: MATCH_TYPE;

    @Default(false)
    @AllowNull(false)
    @Column
    public legacy: boolean;

    @Default(false)
    @AllowNull(false)
    @Column
    public ready: boolean;

    @HasMany(() => Vote)
    public votes: Vote[];

    @BelongsToMany(() => MapR6, () => Pool)
    public pool: MapR6[];

    @BelongsToMany(() => Team, () => TeamMatch)
    public teams: Team[];
}
