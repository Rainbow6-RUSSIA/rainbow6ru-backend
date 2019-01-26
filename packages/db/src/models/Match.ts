import { MATCH_TYPE } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { AllowNull, Column, DataType, Default, HasMany, Model, Table } from 'sequelize-typescript';
import Vote from './Vote';

@Table({schema: 'streambot'})
export default class Match extends Model<Match> {
    @Column(DataType.JSONB)
    public creatorId: Snowflake | Snowflake[];

    @Column(DataType.STRING(5))
    public matchType: MATCH_TYPE;

    @Column
    @Default(false)
    @AllowNull(false)
    public legacy: boolean;

    @Column
    @Default(false)
    @AllowNull(false)
    public ready: boolean;

    @HasMany(() => Vote)
    public votes: Vote[];
}
