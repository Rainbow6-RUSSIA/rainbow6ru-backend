import { BelongsToMany, Column, ForeignKey, HasMany, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import Match from './Match';
import Pool from './Pool';
import Vote from './Vote';

@Table({schema: 'streambot'})
export default class Map extends Model<Map> {
    @PrimaryKey
    @Unique
    @Column
    public id: string;

    @Column
    public splash: string;

    @Column
    public titleRu: string;

    @Column
    public titleEn: string;

    @BelongsToMany(() => Match, () => Pool)
    public matchPools: Match[];

    @HasMany(() => Vote)
    public votes: Vote[];
}
