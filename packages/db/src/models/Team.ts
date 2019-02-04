import { BelongsToMany, Column, HasMany, HasOne, Model, Table } from 'sequelize-typescript';
import Match from './Match';
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

    @HasOne(() => User)
    public captain: User;

    @HasMany(() => User)
    public members: User[];

    @HasMany(() => Match, 'team0Id')
    public matchesLeft: Match[];

    @HasMany(() => Match, 'team1Id')
    public matchesRight: Match[];

    @HasMany(() => Vote)
    public votes: Vote[];
}
