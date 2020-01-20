import { BelongsTo, Column, DataType, ForeignKey, HasOne, Model, Table } from 'sequelize-typescript';
import MapR6 from './MapR6';
import Match from './Match';
import Team from './Team';

@Table({
    schema: 'streambot',
    timestamps: true,
    tableName: 'Vote'
})
export default class Vote extends Model<Vote> {
    @ForeignKey(() => Match)
    public matchId: number;

    @BelongsTo(() => Match, 'Vote_matchId_fkey')
    public match: Match;

    @ForeignKey(() => Team)
    public teamId: number;

    @BelongsTo(() => Team, 'Vote_teamId_fkey')
    public team: Team;

    @ForeignKey(() => MapR6)
    public mapId: string;

    @BelongsTo(() => MapR6, 'Vote_mapId_fkey')
    public map: MapR6;

    @Column(DataType.STRING)
    public type: 'ban' | 'pick' | 'decider';

}
