import { ACCESS, BAN_BADGE, HF_REGIONS, ONLINE_TRACKER, RANKS, REGIONS, VERIFICATION_LEVEL, VERIFIED_BADGE } from '@r6ru/types';
import { AllowNull, BeforeCreate, BeforeUpdate, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Model, NotNull, PrimaryKey, Table } from 'sequelize-typescript';

import { AkairoClient } from 'discord-akairo';
import { Guild as G, Snowflake } from 'discord.js';

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
        instance.karma = likes.length ? likes.filter(l => l).length / likes.length : 0.5;
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

    @Default(new Date())
    @Column
    public securityNotifiedAt: Date;

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

    @BelongsTo(() => Lobby, 'User_lobbyId_fkey')
    public lobby: Lobby;

    @ForeignKey(() => Team)
    @Column
    public teamId: number;

    @BelongsTo(() => Team, 'User_teamId_fkey')
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

    public get isInVerification(): boolean {
        return this.requiredVerification > this.verificationLevel;
    }

    public toString() {
        return ONLINE_TRACKER + this.genome;
    }

    public infoBadge = async (client?: AkairoClient, adminAction?: boolean, bans?: ThenArg<ReturnType<G['fetchBans']>>) => {
        return `<@${this.id}> `
            + (client ? `\`${(await client.users.fetch(this.id)).tag}\`` : '') + ' '
            + this.toString() + ' '
            + `\`${HF_REGIONS[this.region]}\` `
            + (this.isInVerification ? '*требуется верификация*' : '') + ' '
            + (client && this.verificationLevel >= VERIFICATION_LEVEL.QR ? client.emojis.resolve(VERIFIED_BADGE).toString() : '') + ' '
            + (client && adminAction && bans?.has(this.id) ? `${client.emojis.resolve(BAN_BADGE)} \`${bans.get(this.id).reason}\`` : '')
            + (adminAction && this.genomeHistory.length > 1
                ? '\nРанее привязанные аккаунты:\n◦ ' + this.genomeHistory
                    .filter(g => g !== this.genome)
                    .map(g => ONLINE_TRACKER + g)
                    .join('\n◦ ')
                : '')
            + (adminAction
                ? '\nИстория никнеймов:\n◦ ' + this.nicknameHistory
                    .map(nick => `\`${nick}\``)
                    .join('\n◦ ')
                : '');
    }

}

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
