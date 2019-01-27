import { MATCH_TYPE } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { AllowNull, BelongsToMany, Column, DataType, Default, HasMany, Model, Table } from 'sequelize-typescript';
import Team from './Team';
import TeamMatch from './TeamMatch';
import Vote from './Vote';

@Table({schema: 'streambot'})
export default class Match extends Model<Match> {
    @Column(DataType.JSONB)
    public creatorId: Snowflake | Snowflake[];

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

    @BelongsToMany(() => Team, () => TeamMatch)
    public teams: Team[];
}
