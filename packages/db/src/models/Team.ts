import { Model, Table } from 'sequelize-typescript';
import User from './User';

@Table({schema: 'streambot'})
export default class Team extends Model<Team> {

}
