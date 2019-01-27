import { BelongsTo, Column, DataType, ForeignKey, HasOne, Model, Table } from 'sequelize-typescript';
import MapR6 from './MapR6';
import Match from './Match';
import Team from './Team';

@Table({schema: 'streambot', timestamps: true})
export default class Vote extends Model<Vote> {
    @ForeignKey(() => Match)
    public matchId: number;

    @BelongsTo(() => Match)
    public match: Match;

    @ForeignKey(() => Team)
    public teamId: number;

    @BelongsTo(() => Team)
    public team: Team;

    @ForeignKey(() => MapR6)
    public mapId: string;

    @BelongsTo(() => MapR6)
    public map: MapR6;

    @Column(DataType.STRING)
    public type: 'ban' | 'pick' | 'decider';

}
