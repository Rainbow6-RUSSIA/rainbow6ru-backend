import { Column, ForeignKey, HasMany, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
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

    @HasMany(() => Vote)
    public votes: Vote[];
}
