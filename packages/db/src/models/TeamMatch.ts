import {AutoIncrement, Column, DataType, ForeignKey, Model, PrimaryKey, Table, Unique} from 'sequelize-typescript';

import Match from './Match';
import Team from './Team';

@Table({schema: 'siegebot'})
export default class TeamMatch extends Model<TeamMatch> {
    @ForeignKey(() => Team)
    @Column
    public teamId: number;

    @ForeignKey(() => Match)
    @Column
    public matchId: number;
}
