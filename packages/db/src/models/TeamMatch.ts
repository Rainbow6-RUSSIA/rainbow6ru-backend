import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Match from './Match';
import Team from './Team';

@Table({ schema: 'streambot', tableName: 'TeamMatch' })
export default class TeamMatch extends Model<TeamMatch> {
    @ForeignKey(() => Team)
    @Column
    public teamId: number;

    @ForeignKey(() => Match)
    @Column
    public matchId: number;
}
