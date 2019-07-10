import { BelongsToMany, Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';

import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
import User from './User';

import { DonateRecord, RANKS, VERIFICATION_LEVEL } from '@r6ru/types';

import { Snowflake } from 'discord.js';
import Tournament from './Tournament';

@Table({schema: 'siegebot'})
export default class Guild extends Model<Guild> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

    @Column(DataType.INTEGER)
    public fixAfter: RANKS;

    @Column(DataType.JSONB)
    public rankRoles: string[];

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

    @Column(DataType.JSONB)
    public roomsRange: {
        default: [number, number];
        [key: string]: [number, number];
    };

    @Default(false)
    @Column
    public premium: boolean;

    @Column(DataType.JSONB)
    public donateRoles: {
        default: DonateRecord,
        [key: string]: DonateRecord,
    };

    @BelongsToMany(() => User, () => GuildBlacklist)
    public blacklist: Array<User & {GuildBlacklist: GuildBlacklist}>;

    @Column(DataType.ARRAY(DataType.UUID))
    public genomeBlacklist: string[];

    @Column(DataType.INTEGER)
    public requiredVerification: VERIFICATION_LEVEL;

    @Column(DataType.JSONB)
    public options: {
        externalRooms: Snowflake[],
    };

    @Column
    public fastLfg: string;

    @Column
    public logsChannel: string;

    @Column
    public teamRole: string;
}
