import { BelongsToMany, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { User } from './User'
import { GuildBlacklist } from './GuildBlacklist';

import {RANKS, VERIFICATION_LEVEL} from '../types'

@Table
export class Guild extends Model<Guild> {
    @PrimaryKey
    @Column
    public id: string; // discord snowflake

    @Column(DataType.INTEGER)
    public fixAfter: RANKS; // siege rank to fix

    @Column(DataType.ARRAY(DataType.STRING))
    public rankRoles: string[]; // any rank to any role

    @Column(DataType.JSONB)
    public platformRoles: {
        PC: string,
        PS4: string,
        XBOX: string
    };

    @Column
    public premium: boolean; // idk mb unused in future

    // @HasMany(() => User)
    // public blacklist: User[]; // User blacklist
    // @Column(DataType.ARRAY(DataType.UUID))
    @BelongsToMany(() => User, () => GuildBlacklist)
    public blacklist: User[];

    @Column(DataType.INTEGER)
    public requiredVerification: VERIFICATION_LEVEL;

    @Column(DataType.JSONB)
    public options: any;
}
