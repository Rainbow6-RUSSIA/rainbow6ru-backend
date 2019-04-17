import { BelongsToMany, Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';

import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
import User from './User';

import { RANKS, VERIFICATION_LEVEL } from '@r6ru/types';

import { Snowflake } from 'discord.js';
import Tournament from './Tournament';

@Table({schema: 'siegebot'})
export default class Guild extends Model<Guild> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

    @Column(DataType.INTEGER)
    public fixAfter: RANKS; // siege rank to fix

    @Column(DataType.JSONB)
    public rankRoles: string[]; // any rank to any role

    @Column(DataType.JSONB)
    public platformRoles: {
        PC: string,
        PS4: string,
        XBOX: string,
    };

    @Column(DataType.JSONB)
    public voiceCategories: {
        [key: string]: Snowflake;
    };

    @Column(DataType.JSONB)
    public lfgChannels: {
        [key: string]: Snowflake;
    };

    @HasMany(() => Lobby)
    public lobbys: Lobby[];

    @HasMany(() => Tournament)
    public tournaments: Tournament[];

    @Column(DataType.ARRAY(DataType.INTEGER))
    public roomsRange: [number, number];

    @Column
    public premium: boolean; // idk mb unused in future

    @BelongsToMany(() => User, () => GuildBlacklist)
    public blacklist: Array<User & {GuildBlacklist: GuildBlacklist}>;

    @Column(DataType.INTEGER)
    public requiredVerification: VERIFICATION_LEVEL;

    @Column(DataType.JSONB)
    public options: any;

    @Column
    public logsChannel: string;

    @Column
    public teamRole: string;
}
