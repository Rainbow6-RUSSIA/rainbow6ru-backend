import { ACCESS, RANKS, REGIONS, VERIFICATION_LEVEL } from '@r6ru/types';
import { BeforeCreate, BeforeUpdate, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';

import Guild from './Guild';
import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
import Team from './Team';

import { Snowflake } from 'discord.js';
import Match from './Match';

@Table({schema: 'siegebot', timestamps: true})
export default class User extends Model<User> {
    @BeforeCreate
    public static initHistory(instance: User) {
        instance.genomeHistory = [instance.genome];
        instance.nicknameHistory = [instance.nickname.toLowerCase()];
    }

    @BeforeUpdate
    public static addHistory(instance: User) {
        if (!instance.genomeHistory.includes(instance.genome)) {
            instance.genomeHistory = [...instance.genomeHistory, instance.genome];
        }
        if (!instance.nicknameHistory.includes(instance.nickname.toLowerCase())) {
            instance.nicknameHistory = [...instance.nicknameHistory, instance.nickname.toLowerCase()];
        }
    }

    @BeforeUpdate
    public static calculateKarma(instance: User) {
        const likes = Object.values(instance.likes || {});
        instance.karma = likes.length ? likes.filter((l) => l).length / likes.length : 0.5;
    }

    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

    @Column(DataType.UUID)
    public genome: string;

    @Column(DataType.ARRAY(DataType.UUID))
    public genomeHistory: string[];

    @Column(DataType.STRING(20))
    public nickname: string;

    @Column(DataType.ARRAY(DataType.STRING(20)))
    public nicknameHistory: string[];

    @Column
    public rankUpdatedAt: Date;

    @Column
    public nicknameUpdatedAt: Date;

    @Column
    public inactive: boolean;

    @Column
    public syncNickname: boolean;

    @ForeignKey(() => Lobby)
    @Column
    public lobbyId: number;

    @BelongsTo(() => Lobby)
    public lobby: Lobby;

    @ForeignKey(() => Team)
    @Column
    public teamId: number;

    @BelongsTo(() => Team)
    public team: Team;

    @HasMany(() => Match)
    public matches: Match[];

    @BelongsToMany(() => Guild, () => GuildBlacklist)
    public bannedAt: Guild[];

    @Column(DataType.INTEGER)
    public rank: RANKS;

    @Column(DataType.STRING)
    public region: REGIONS;

    @Default(0)
    @Column(DataType.INTEGER)
    public verificationLevel: VERIFICATION_LEVEL;

    @Column(DataType.INTEGER)
    public requiredVerification: VERIFICATION_LEVEL;

    @Column(DataType.JSONB)
    public platform: {
        PC: boolean,
        PS4: boolean,
        XBOX: boolean,
    };

    @Column(DataType.INTEGER)
    public access: ACCESS;

    @Column(DataType.JSONB)
    public likes: {
        [key: string]: boolean;
    };

    @Column(DataType.FLOAT)
    public karma: number;
}
