import { BelongsTo, Column, DataType, ForeignKey, HasOne, Model, Table } from 'sequelize-typescript';
import Map from './Map';
import Match from './Match';
import Team from './Team';

@Table({schema: 'streambot'})
export default class Vote extends Model<Vote> {
    @ForeignKey(() => Match)
    public matchId: number;

    @BelongsTo(() => Match)
    public match: Match;

    @ForeignKey(() => Team)
    public teamId: number;

    @BelongsTo(() => Team)
    public team: Team;

    @ForeignKey(() => Map)
    public mapId: string;

    @BelongsTo(() => Map)
    public map: Map;

    @Column(DataType.STRING)
    public type: 'ban' | 'pick' | 'decider';

}
