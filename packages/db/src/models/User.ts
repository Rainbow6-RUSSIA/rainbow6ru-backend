import { ACCESS, BAN_BADGE, HF_REGIONS, ONLINE_TRACKER, RANKS, REGIONS, VERIFICATION_LEVEL, VERIFIED_BADGE } from '@r6ru/types';
import { Client, Guild as G, Snowflake } from 'discord.js';
import { AllowNull, BeforeCreate, BeforeUpdate, BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import Guild from './Guild';
import Account from './Account';
import UserAccount from './UserAccount';
import GuildBlacklist from './GuildBlacklist';
import Lobby from './Lobby';
// import Team from './Team';

@Table({
    schema: 'siegebot',
    timestamps: true,
    tableName: 'User',
})
export default class User extends Model<User> {
    @BeforeUpdate
    public static calculateKarma(instance: User) {
        const likes = Object.values(instance.likes || {});
        instance.karma = likes.length ? likes.filter((l) => l).length / likes.length : 0.5;
    }

    @PrimaryKey
    @Column(DataType.STRING)
    public id: Snowflake; // discord snowflake

    @BelongsToMany(() => Account, () => UserAccount)
    public accounts: Array<Account & { UserAccount: UserAccount }>

    @Default(new Date())
    @Column
    public securityNotifiedAt: Date;

    @AllowNull(false)
    @Default(true)
    @Column
    public active: boolean;

    @Default(false)
    @Column
    public syncNickname: boolean;

    @ForeignKey(() => Lobby)
    @Column
    public lobbyId: number;

    @BelongsTo(() => Lobby, 'User_lobbyId_fkey')
    public lobby: Lobby;

    // @ForeignKey(() => Team)
    // @Column
    // public teamId: number;

    @BelongsToMany(() => Guild, () => GuildBlacklist)
    public bannedAt: (Guild & { GuildBlacklist: GuildBlacklist })[];

    @Column(DataType.STRING)
    public region: REGIONS;

    @Column(DataType.INTEGER)
    public verificationRequired: boolean;

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

    public infoBadge = async (
        client?: Client,
        adminAction?: boolean,
        bans?: ThenArg<ReturnType<G['fetchBans']>>,
    ) => {
        return (
            `<@${this.id}> ` +
            (client ? `\`${(await client.users.fetch(this.id)).tag}\`` : '') +
            ' ' +
            this.toString() +
            ' ' +
            `\`${HF_REGIONS[this.region]}\` ` +
            (this.isInVerification ? '*требуется верификация*' : '') +
            ' ' +
            (client && this.verificationLevel >= VERIFICATION_LEVEL.QR
                ? client.emojis.resolve(VERIFIED_BADGE).toString()
                : '') +
            ' ' +
            (client && adminAction && bans?.has(this.id)
                ? `${client.emojis.resolve(BAN_BADGE)} \`${bans.get(this.id).reason}\``
                : '') +
            (adminAction && this.genomeHistory.length > 1
                ? '\nРанее привязанные аккаунты:\n◦ ' +
                  this.genomeHistory
                      .filter((g) => g !== this.genome)
                      .map((g) => ONLINE_TRACKER + g)
                      .join('\n◦ ')
                : '') +
            (adminAction
                ? '\nИстория никнеймов:\n◦ ' + this.nicknameHistory.map((nick) => `\`${nick}\``).join('\n◦ ')
                : '')
        );
    };
}

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
