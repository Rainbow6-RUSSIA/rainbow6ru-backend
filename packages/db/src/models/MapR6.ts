import { AllowNull, BelongsToMany, Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import Pool from './Pool';
import Tournament from './Tournament';
import Vote from './Vote';

@Table({schema: 'streambot', tableName: 'MapR6'})
export default class MapR6 extends Model<MapR6> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: string;

    @AllowNull
    @Column
    public splash?: string;

    @AllowNull
    @Column
    public titleRu: string;

    @AllowNull
    @Column
    public titleEn: string;

    @BelongsToMany(() => Tournament, () => Pool)
    public tournamentPools: Array<Tournament & {Pool: Pool}>;

    @HasMany(() => Vote, 'Vote_mapId_fkey')
    public votes: Vote[];
}
