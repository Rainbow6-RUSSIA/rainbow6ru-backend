import { DonateRecord, ILobbySettings, RANKS, VERIFICATION_LEVEL } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { BelongsToMany, Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Platform } from 'r6api.js'
import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
import User from './User';

@Table({
    schema: 'siegebot',
    tableName: 'Guild',
    timestamps: false,
})
export default class Guild extends Model<Guild> {
    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

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

    @BelongsToMany(() => User, () => GuildBlacklist) // rework to HasMany UserAccount + merge genomeBlacklist
    public blacklist: Array<User & { GuildBlacklist: GuildBlacklist }>;

    @Column(DataType.ARRAY(DataType.UUID))
    public genomeBlacklist: string[];

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
