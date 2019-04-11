import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import MapR6 from './MapR6';
import Tournament from './Tournament';

@Table({schema: 'streambot'})
export default class Pool extends Model<Pool> {
    @ForeignKey(() => Tournament)
    @Column
    public tournamentId: number;

    @ForeignKey(() => MapR6)
    @Column
    public mapId: string;
}
