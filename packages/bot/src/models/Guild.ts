import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class Guild extends Model<Guild> {
    @PrimaryKey
    @Column
    public id: string;

    @Column
    public fixAfter: number;

    @Column(DataType.ARRAY(DataType.STRING))
    public rankRoles: string[];

    @Column
    public premium: boolean;

    @Column(DataType.ARRAY(DataType.STRING))
    public blacklist: string[];

    @Column
    public requiredVerification: number;
}
