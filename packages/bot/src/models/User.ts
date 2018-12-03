import { BelongsToMany, Column, DataType, Default, Model, PrimaryKey, Table, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { ACCESS, PLATFORM, VERIFICATION_LEVEL } from '../types'
import { Guild } from './Guild';
import { GuildBlacklist } from './GuildBlacklist';

@Table({
    timestamps: true,
    // scheme:
})
export class User extends Model<User> {
    @PrimaryKey
    @Column
    public id: string; // discord snowflake

    @Column(DataType.UUID)
    public genome: string;

    @Column(DataType.ARRAY(DataType.UUID))
    public genomeHistory: string[];

    @Column
    public nickname: string;

    @Column(DataType.ARRAY(DataType.STRING))
    public nicknameHistory: string[];

    // @Column(DataType.ARRAY(DataType.STRING))
    // public blacklist: string[]; // genome blacklist
    @BelongsToMany(() => Guild, () => GuildBlacklist)
    bannedAt: Guild[];

    @Column
    public rank: number;

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
        let old = this.getDataValue('genomeHistory') as string[];
        if (!old.includes(genome)) {
            this.setDataValue('genomeHistory', old.push(genome))
        }
    }

    public pushNickname = (nickname) => {
        let old = this.getDataValue('nicknameHistory') as string[];
        if (!old.includes(nickname)) {
            this.setDataValue('nicknameHistory', old.push(nickname))
        }
    }
}