import { Column, Default, ForeignKey, Model, Table, DataType } from 'sequelize-typescript';
import Account from './Account';
import User from './User';

@Table({ schema: 'siegebot', timestamps: true })
export default class UserAccount extends Model<UserAccount> {
    @ForeignKey(() => User)
    @Column
    public userId: string;

    @ForeignKey(() => Account)
    @Column(DataType.UUID)
    public accountId: string;

    @Default(false)
    @Column
    public verified: boolean;

    @Default(false)
    @Column
    public verificationRequired: boolean;

    @Default(false)
    @Column
    public main: boolean;
}
