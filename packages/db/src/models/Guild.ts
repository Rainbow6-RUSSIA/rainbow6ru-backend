import { DonateRecord, ILobbySettings, RANKS } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { BelongsToMany, Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Platform } from 'r6api.js';
import Lobby from './Lobby';
import User from './User';

@Table({
    schema: 'siegebot',
    timestamps: false,
})
export default class Guild extends Model<Guild> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake;

    @Column(DataType.INTEGER)
    public fixAfter: RANKS;

    @Column(DataType.JSONB)
    public rankRoles: string[];

    @Column(DataType.JSONB)
    public platformRoles: Record<Platform, Snowflake>;

    @HasMany(() => Lobby)
    public lobbies: Lobby[];

    @Default(false)
    @Column
    public premium: boolean;

    @Column(DataType.JSONB)
    public donateRoles: {
        default: DonateRecord;
        [key: string]: DonateRecord;
    };

    /**
     * Связанные UserAccounts через connectionId. Нужно подгрузить отдельно
     *
     * @type {string[]}
     * @memberof Guild
     */
    @Column(DataType.ARRAY(DataType.UUID))
    public blacklist: string[];

    @Column
    public verificationRequired: boolean;

    @Column
    public fastLfg: string;

    @Column
    public logsChannel: string;

    @Column
    public teamRole: string;

    @Column(DataType.JSONB)
    public lobbySettings: {
        [key: string]: ILobbySettings;
    };
}
