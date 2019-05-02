import { ACCESS, RANKS, REGIONS, VERIFICATION_LEVEL } from '@r6ru/types';
import { AllowNull, BeforeCreate, BeforeUpdate, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Model, NotNull, PrimaryKey, Table } from 'sequelize-typescript';

import { Snowflake } from 'discord.js';

import Guild from './Guild';
import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
import Match from './Match';
import Team from './Team';
import Tournament from './Tournament';
import TournamentMod from './TournamentMod';

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

    @Default(new Date())
    @Column
    public rankUpdatedAt: Date;

    @Default(new Date())
    @Column
    public nicknameUpdatedAt: Date;

    @AllowNull(false)
    @Default(false)
    @Column
    public inactive: boolean;

    @Default(false)
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

    @BelongsToMany(() => Tournament, () => TournamentMod)
    public tournaments: Array<Tournament & {TournamentMod: TournamentMod}>;

    @BelongsToMany(() => Guild, () => GuildBlacklist)
    public bannedAt: Array<Guild & {GuildBlacklist: GuildBlacklist}>;

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
