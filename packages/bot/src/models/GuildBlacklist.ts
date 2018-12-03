import {Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {User} from "./User";
import {Guild} from "./Guild";

@Table
export class GuildBlacklist extends Model<GuildBlacklist> {
    @ForeignKey(() => User)
    @Column
    userId: string;

    @ForeignKey(() => Guild)
    @Column
    guildId: string;
}