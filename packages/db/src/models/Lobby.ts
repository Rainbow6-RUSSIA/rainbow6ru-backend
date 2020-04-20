import { IngameStatus as IS, LOBBY_FLAGS, LobbyType, LobbyStoreEventType } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import Guild from './Guild';
import User from './User';

@Table({
    schema: 'siegebot',
    timestamps: true,
})
export default class Lobby extends Model<Lobby> {
    @BeforeCreate
    public static initLog(instance: Lobby) {
        instance.log = [];
    }

    @BeforeUpdate
    public static addLog(instance: Lobby) {
        if (instance.members) {
            instance.log = [
                ...instance.log,
                ...instance.members.map((u) => u.id).filter((u) => !instance.log.includes(u)),
            ];
        }
    }

    @Column
    public description: string;

    @Default(true)
    @Column
    public active: boolean;

    @Column(DataType.INTEGER)
    public flags: LOBBY_FLAGS;

    @Column
    public invite: string;

    @Default(IS.OTHER)
    @Column
    public status: IS;

    @Column(DataType.INTEGER)
    public type: LobbyType;

    @Column
    public channel: Snowflake;

    @ForeignKey(() => Guild)
    @Column
    public guildId: Snowflake;

    @BelongsTo(() => Guild)
    public guild: Guild;

    @HasMany(() => User)
    public members: User[];

    /**
     * [memberId, action, timestamp]
     *
     * @type {[Snowflake, LobbyStoreEventType, number][]}
     * @memberof Lobby
     */
    @Default([])
    @Column(DataType.JSONB)
    public log: [Snowflake, LobbyStoreEventType, number][];

    @Column
    public initiatedAt: Date;

    @Column
    public scheduledAt: Date;
}
