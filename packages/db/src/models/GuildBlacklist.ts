import { Column, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import Guild from './Guild';
import User from './User';

@Table({ schema: 'siegebot', timestamps: true })
export default class GuildBlacklist extends Model<GuildBlacklist> {
    @ForeignKey(() => User)
    @Column
    public userId: string;

    @ForeignKey(() => Guild)
    @Column
    public guildId: string;

    @Default(new Date())
    @Column
    public createdAt: Date;

    @Default(new Date())
    @Column
    public updatedAt: Date;

    @Default(false)
    @Column
    public allowed: boolean;
}
