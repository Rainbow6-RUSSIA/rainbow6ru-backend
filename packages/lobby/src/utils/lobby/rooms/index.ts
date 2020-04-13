import { Lobby } from '@r6ru/db';
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

export { CasualRoom } from './casual';
export { RankedRoom } from './ranked';
export { UntrackedRoom } from './untracked';
