import { DonateRecord, ILobbySettings, RANKS, VERIFICATION_LEVEL } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { BelongsToMany, Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
import Tournament from './Tournament';
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
    public platformRoles: {
        PC: string;
        PS4: string;
        XBOX: string;
    };

    @HasMany(() => Lobby, 'Lobby_guildId_fkey')
    public lobbies: Lobby[];

    @HasMany(() => Tournament, 'Tournament_guildId_fkey')
    public tournaments: Tournament[];

    @Default(false)
    @Column
    public premium: boolean;

    @Column(DataType.JSONB)
    public donateRoles: {
        default: DonateRecord;
        [key: string]: DonateRecord;
    };

    @BelongsToMany(() => User, () => GuildBlacklist)
    public blacklist: Array<User & { GuildBlacklist: GuildBlacklist }>;

    @Column(DataType.ARRAY(DataType.UUID))
    public genomeBlacklist: string[];

    @Column(DataType.INTEGER)
    public requiredVerification: VERIFICATION_LEVEL;

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
