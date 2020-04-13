import { Lobby, User } from '@r6ru/db';
import {
    CategoryChannel,
    Collection,
    GuildMember,
    Message,
    MessageOptions,
    Snowflake,
    TextChannel,
    VoiceChannel,
} from 'discord.js';
// import { LobbyStoreEventType } from '@r6ru/types';
import { LobbyType } from '..';

export abstract class Room {
    constructor(private db?: Lobby) {}

    public abstract type: LobbyType;
    public abstract init(): Promise<this>;
    public abstract generateAppeal(): void;
    public abstract from(lobby: Lobby): this;

    public async join() {}

    public async leave() {}
}

// export interface IJoinable<T> {
//     join(member: GuildMember): Promise<T>
//     leave(member: GuildMember): Promise<T>
// }

export { RankedRoom } from './ranked';
export { UntrackedRoom } from './untracked';
export { CasualRoom } from './casual';
