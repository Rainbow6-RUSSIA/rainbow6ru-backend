import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Map from './Map';
import Match from './Match';

@Table({schema: 'streambot'})
export default class Pool extends Model<Pool> {
    @ForeignKey(() => Match)
    @Column
    public matchId: number;

    @ForeignKey(() => Map)
    @Column
    public mapId: string;
}
