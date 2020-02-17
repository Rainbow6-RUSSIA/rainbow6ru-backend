import { Lobby, User } from '@r6ru/db';
import { CategoryChannel, Collection, GuildMember, Message, MessageOptions, Snowflake, TextChannel, VoiceChannel } from 'discord.js';

export abstract class Room extends Lobby {
    constructor() {
        super();
    }

    public abstract generateAppeal(): void;
    public abstract from(lobby: Lobby): void;

    public async join() {

    }

    public async leave() {

    }
}

// export interface IJoinable<T> {
//     join(member: GuildMember): Promise<T>
//     leave(member: GuildMember): Promise<T>
// }

export { RankedRoom } from './ranked'
export { UntrackedRoom } from './untracked'
export { CasualRoom } from './casual'