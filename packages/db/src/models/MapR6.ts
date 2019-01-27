import { AllowNull, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import Match from './Match';
import Pool from './Pool';
import Vote from './Vote';

@Table({schema: 'streambot'})
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

    @BelongsToMany(() => Match, () => Pool)
    public matchPools: Match[];

    @HasMany(() => Vote)
    public votes: Vote[];
}
