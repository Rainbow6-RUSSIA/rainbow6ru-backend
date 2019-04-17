import { BelongsToMany, Column, DataType, HasMany, HasOne, Model, Table } from 'sequelize-typescript';
import Match from './Match';
import TeamMatch from './TeamMatch';
import User from './User';
import Vote from './Vote';

@Table({schema: 'streambot'})
export default class Team extends Model<Team> {
    @Column
    public name: string;

    @Column
    public shortName: string;

    @Column
    public logo: string;

    @Column
    public role: string;

    @HasOne(() => User)
    public captain: User;

    @HasMany(() => User)
    public members: User[];

    @BelongsToMany(() => Match, () => TeamMatch)
    public matches: Array<Match & {TeamMatch: TeamMatch}>;

    @HasMany(() => Vote)
    public votes: Vote[];
}
