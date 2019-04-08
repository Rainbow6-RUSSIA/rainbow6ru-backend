import { MATCH_TYPE } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { AllowNull, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';
import MapR6 from './MapR6';
import Pool from './Pool';
import Team from './Team';
import Tournament from './Tournament';
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

    @Column(DataType.ARRAY(DataType.INTEGER))
    public mapScore: [number, number];

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

    @Column(DataType.JSONB)
    public poolCache: MapR6[];

    @ForeignKey(() => Team)
    public team0Id: number;
    @BelongsTo(() => Team, 'team0Id')
    public team0: Team;

    @ForeignKey(() => Team)
    public team1Id: number;
    @BelongsTo(() => Team, 'team1Id')
    public team1: Team;

    @ForeignKey(() => Tournament)
    @Column
    public tournamentId: number;

    @BelongsTo(() => Tournament)
    public tournament: Tournament;

    public swapped: boolean;

    public async swap() {
        const t0 = await this.$get('team0');
        const t1 = await this.$get('team1');
        await this.$set('team0', t1);
        await this.$set('team1', t0);
        await this.reload();
        await this.save();
    }
}
