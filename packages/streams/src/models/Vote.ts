import { BelongsTo, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Match } from './Match';

@Table
export class Vote extends Model<Vote> {
    @ForeignKey(() => Match)
    public matchId: number;

    @BelongsTo(() => Match)
    public match: Match;

}
