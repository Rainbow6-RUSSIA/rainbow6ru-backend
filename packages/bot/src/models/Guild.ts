import { BelongsToMany, Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { GuildBlacklist } from './GuildBlacklist';
import { User } from './User';

import {RANKS, VERIFICATION_LEVEL} from '../utils/types';

import { Snowflake } from 'discord.js';
import { Lobby } from './Lobby';

@Table
export class Guild extends Model<Guild> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

    @Column(DataType.INTEGER)
    public fixAfter: RANKS; // siege rank to fix

    @Column(DataType.ARRAY(DataType.STRING))
    public rankRoles: string[]; // any rank to any role

    @Column(DataType.JSONB)
    public platformRoles: {
        PC: string,
        PS4: string,
        XBOX: string,
    };

    @Column(DataType.JSONB)
    public voiceCategories: {
        ranked: string | string[],
        casual: string | string[],
        custom: string | string[],
    };

    @Column(DataType.JSONB)
    public lfgChannels: {
        ranked: string,
        casual: string,
        custom: string,
        any: string,
    };

    @HasMany(() => Lobby)
    public lobbys: Lobby[];

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

    @Column
    public logsChannel: string;
}
