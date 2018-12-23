import { BelongsToMany, Column, DataType, Default, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript';
import { ACCESS, IHistoryRecord, PLATFORM, RANKS, REGIONS, VERIFICATION_LEVEL } from '../utils/types';
import { Guild } from './Guild';
import { GuildBlacklist } from './GuildBlacklist';

import { Snowflake } from 'discord.js';

@Table({
    timestamps: true,
    // scheme:
})
export class User extends Model<User> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

    @Column(DataType.UUID)
    public genome: string;

    @Column(DataType.ARRAY(DataType.JSONB))
    public genomeHistory: IHistoryRecord[];

    @Column(DataType.STRING(15))
    public nickname: string;

    @Column(DataType.ARRAY(DataType.JSONB))
    public nicknameHistory: IHistoryRecord[];

    @Column
    public inactive: boolean;

    // @Column(DataType.ARRAY(DataType.STRING))
    // public blacklist: string[]; // genome blacklist
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

    @Column(DataType.STRING)
    public platform: PLATFORM;

    @Column(DataType.INTEGER)
    public access: ACCESS;

    public pushGenome = (genome: string): void => {
        const old = this.getDataValue('genomeHistory') as IHistoryRecord[] || [];
        if (!old.some((r) => r.record === genome)) {
            this.setDataValue('genomeHistory', old.push({
                record: genome,
                timestamp: Date.now()
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
