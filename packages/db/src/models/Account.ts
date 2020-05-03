import { BelongsToMany, Column, DataType, Default, Model, PrimaryKey, Table, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import { Platform, LevelInfo, PlaytimeInfo, Region, RankRegion, RankStat, PvP, PvE } from 'r6api.js';

type withTime<T> = T & {timestamp: number};
type PreparedData<T> = withTime<Omit<T, 'id'>>
type CroppedRankStat = Omit<RankStat, 'name' | 'image'>;
type PreparedRankData = withTime<Record<Region, Omit<RankRegion, 'current' | 'max'> & {current: CroppedRankStat, max: CroppedRankStat}>>;
type PreparedStatsData = withTime<{
    pvp: Omit<PvP, 'weapons' | 'operators'>
    pve: Omit<PvE, 'weapons' | 'operators'>
}>

@Table({ schema: 'statsbot' })
export default class Account extends Model<Account> {
    @PrimaryKey
    @Column(DataType.UUID)
    public id: string;

    // General info

    /**
     * Для верификации по QR коду (на консолях отличается)
     *
     * @type {string}
     * @memberof Account
     */
    @Column(DataType.UUID)
    public userId?: string;

    @Column(DataType.STRING(20))
    public username: string;

    @Column
    public platform: Platform;

    @Column(DataType.JSONB)
    public usernameHistory: {name: string, timestamp: number}[];

    // Game info

    @Column(DataType.JSONB)
    public levelInfo: PreparedData<LevelInfo>

    @Column(DataType.JSONB)
    public levelInfoPrev: PreparedData<LevelInfo>

    @Column(DataType.JSONB)
    public playtimeInfo: PreparedData<PlaytimeInfo>

    @Column(DataType.JSONB)
    public playtimeInfoPrev: PreparedData<PlaytimeInfo>

    @Column(DataType.JSONB)
    public rankInfo: PreparedRankData

    @Column(DataType.JSONB)
    public rankInfoPrev: PreparedRankData

    @Column(DataType.JSONB)
    public statsInfo: PreparedStatsData

    @Column(DataType.JSONB)
    public statsInfoPrev: PreparedStatsData

    // Timestamps

    @Default(new Date())
    @Column
    public usernameUpdatedAt: Date;

    @Default(new Date())
    @Column
    public levelUpdatedAt: Date;

    @Default(new Date())
    @Column
    public playtimeUpdatedAt: Date;

    @Default(new Date())
    @Column
    public rankUpdatedAt: Date;

    @Default(new Date())
    @Column
    public statsUpdatedAt: Date;

    // Hooks

    @BeforeCreate
    public static initHistory(instance: Account) {
        instance.usernameHistory = [{
            name: instance.username.toLowerCase(),
            timestamp: Date.now()
        }];
    }

    @BeforeUpdate
    public static addHistory(instance: Account) {
        if (instance.usernameHistory[0].name !== instance.username.toLowerCase()) {
            instance.usernameHistory = [
                {
                    name: instance.username.toLowerCase(),
                    timestamp: Date.now()
                },
                ...instance.usernameHistory
            ];
        }
    }

}
