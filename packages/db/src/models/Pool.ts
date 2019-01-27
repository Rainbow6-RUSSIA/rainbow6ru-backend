import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import MapR6 from './MapR6';
import Match from './Match';

@Table({schema: 'streambot'})
export default class Pool extends Model<Pool> {
    @ForeignKey(() => Match)
    @Column
    public matchId: number;

    @ForeignKey(() => MapR6)
    @Column
    public mapId: string;
}
