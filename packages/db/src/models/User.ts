import { ACCESS, IHistoryRecord, RANKS, REGIONS, VERIFICATION_LEVEL } from '@r6ru/types';
import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript';

import Guild from './Guild';
import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
import Team from './Team';

import { Snowflake } from 'discord.js';
import Match from './Match';

@Table({schema: 'siegebot', timestamps: true})
export default class User extends Model<User> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

    @Column(DataType.UUID)
    public genome: string;

    @Column(DataType.ARRAY(DataType.UUID))
    public genomeHistory: string[];

    @Column(DataType.STRING(15))
    public nickname: string;

    @Column(DataType.ARRAY(DataType.STRING(15)))
    public nicknameHistory: string[];

    @Column
    public inactive: boolean;

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

    @Column(DataType.FLOAT)
    public karma: number;

    public pushGenome = (genome: string): void => {
        const old = this.getDataValue('genomeHistory') as IHistoryRecord[] || [];
        if (!old.some((r) => r.record === genome)) {
            this.setDataValue('genomeHistory', old.push({
                record: genome,
                timestamp: Date.now(),
            }));
        }
    }

    public pushNickname = (nickname: string): void => {
        const old = this.getDataValue('nicknameHistory') as IHistoryRecord[] || [];
        if (!old.some((r) => r.record === nickname)) {
            this.setDataValue('nicknameHistory', old.push({
                record: nickname,
                timestamp: Date.now(),
            }));
        }
    }
}
