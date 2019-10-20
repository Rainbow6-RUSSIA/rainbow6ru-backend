import { DefaultSocial } from '@r6ru/types';
import { Snowflake } from 'discord.js';
import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, HasOne, Model, Table } from 'sequelize-typescript';
import Guild from './Guild';
import MapR6 from './MapR6';
import Match from './Match';
import Pool from './Pool';
import TournamentMod from './TournamentMod';
import User from './User';

@Table({schema: 'streambot'})
export default class Tournament extends Model<Tournament> {
    @Column
    public name: string;

    @Column
    public shortName: string;

    @Default(true)
    @Column
    public active: boolean;

    @Column(DataType.ARRAY(DataType.STRING))
    public sponsors: string[];

    @Column(DataType.ARRAY(DataType.STRING))
    public sponsorsBanners: string[];

    @Column
    public logo: string;

    @Column
    public background: string;

    @Default(DefaultSocial)
    @Column(DataType.JSONB)
    public social: typeof DefaultSocial;

    @ForeignKey(() => Guild)
    @Column
    public guildId: Snowflake;

    @BelongsTo(() => Guild, 'Tournament_guildId_fkey')
    public guild: Guild;

    @HasMany(() => Match, 'Match_tournamentId_fkey')
    public matches: Match[];

    @BelongsToMany(() => MapR6, () => Pool)
    public pool: Array<MapR6 & {Pool: Pool}>;

    @BelongsToMany(() => User, () => TournamentMod)
    public moderators: Array<User & {TournamentMod: TournamentMod}>;
}
