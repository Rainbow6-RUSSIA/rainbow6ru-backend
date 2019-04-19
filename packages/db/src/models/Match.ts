import { MATCH_TYPE } from '@r6ru/types';
import { AllowNull, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';
import MapR6 from './MapR6';
import Team from './Team';
import TeamMatch from './TeamMatch';
import Tournament from './Tournament';
import Vote from './Vote';

@Table({schema: 'streambot'})
export default class Match extends Model<Match> {

    @Column(DataType.STRING(5))
    public matchType: MATCH_TYPE;

    @Column(DataType.ARRAY(DataType.INTEGER))
    public mapScore: [number, number];

    @Default(false)
    @AllowNull(false)
    @Column
    public legacy: boolean;

    @Default(true)
    @AllowNull(false)
    @Column
    public active: boolean;

    @HasMany(() => Vote)
    public votes: Vote[];

    @Column(DataType.JSONB)
    public poolCache: MapR6[];

    @BelongsToMany(() => Team, () => TeamMatch)
    public teams: Array<Team & {TeamMatch: TeamMatch}>;

    @ForeignKey(() => Tournament)
    @Column
    public tournamentId: number;

    @BelongsTo(() => Tournament)
    public tournament: Tournament;

    @Default(false)
    @Column
    public swapped: boolean;
}
