import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';

import Tournament from './Tournament';
import User from './User';

@Table({schema: 'streambot'})
export default class TournamentMod extends Model<TournamentMod> {
    @ForeignKey(() => User)
    @Column
    public userId: string;

    @ForeignKey(() => Tournament)
    @Column
    public tournamentId: number;
}
