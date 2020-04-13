import { BelongsToMany, Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ schema: 'statsbot' })
export default class Account extends Model<Account> {
    @PrimaryKey
    @Column(DataType.UUID)
    public id: string;

    @Column(DataType.UUID)
    public userId?: string;

    @Column(DataType.STRING(20))
    public nickname: string;

    @Column(DataType.ARRAY(DataType.STRING(20)))
    public nicknameHistory: string[];

    @Default(new Date())
    @Column
    public rankUpdatedAt: Date;

    @Default(new Date())
    @Column
    public nicknameUpdatedAt: Date;

    @BelongsToMany(() => Tournament, () => Pool)
    public tournamentPools: (Tournament & { Pool: Pool })[];
}
