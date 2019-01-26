import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';

import Guild from './Guild';
import User from './User';

@Table({schema: 'siegebot'})
export default class GuildBlacklist extends Model<GuildBlacklist> {
    @ForeignKey(() => User)
    @Column
    public userId: string;

    @ForeignKey(() => Guild)
    @Column
    public guildId: string;
}
