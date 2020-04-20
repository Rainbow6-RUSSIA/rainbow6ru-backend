import { Column, Default, ForeignKey, Model, Table, DataType, Unique } from 'sequelize-typescript';
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

    @Unique
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    public connectionId: string;

    @Default(false)
    @Column
    public verified: boolean;

    @Default(false)
    @Column
    public verificationRequired: boolean;

    /**
     * Один основной аккаунт на пользователя среди всех аккаунтов
     *
     * @type {boolean}
     * @memberof UserAccount
     */
    @Default(false)
    @Column
    public main: boolean;
}
