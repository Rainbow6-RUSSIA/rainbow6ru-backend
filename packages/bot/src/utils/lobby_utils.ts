import { Guild, Lobby, User } from '@r6ru/db';
import { ILobbyStoreEventType, IngameStatus, LobbyStoreStatus as LSS, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS } from '@r6ru/types';
import { CategoryChannel, Collection, GuildMember, Presence, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import ENV from '../utils/env';

export interface ILobbyStoreEvent {
    type: ILobbyStoreEventType;
    user: User;
    member: GuildMember;
    voice: VoiceChannel;
    lobby: Lobby;
}

export class LSBase {
    public static detectIngameStatus = (presence: Presence): IngameStatus => {
        const { activity } = presence;
        if (activity && activity.applicationID === R6_PRESENCE_ID) {
            return R6_PRESENCE_REGEXPS.findIndex((ar) => ar.some((r) => r.test(activity.details)));
        } else {
            return IngameStatus.OTHER;
        }
    }

    public categoryId: Snowflake;
    public category: CategoryChannel;
    public lfgChannel: TextChannel;
    public lfgChannelId: Snowflake;
    public guild: Guild;
    public type: string;
    public lobbies: Collection<Snowflake, Lobby>;
    get voices() {
        return this.category.children.filter((ch) => ch.type === 'voice' && !ch.deleted);
    }
    public events: Array<Partial<ILobbyStoreEvent>> = [];
    public status: LSS = LSS.LOADING;
    public promiseQueue = [];

    public waitReady = async () => {
        return new Promise((resolve) => {
            const waiter = () => {
                if (!this.promiseQueue.length) { return resolve(); }
                setTimeout(waiter, 25);
            };
            waiter();
        });
    }

    public addEvent = async (e: Partial<ILobbyStoreEvent>) => {
        if (this.events.length >= parseInt(ENV.EVENT_QUEUE_LENGTH)) {
            this.events.pop();
        }
        this.events.unshift(e);
    }

    public waitLoaded = async () => {
        return new Promise((resolve) => {
            const waiter = () => {
                if (this.status === LSS.AVAILABLE) { return resolve(); }
                setTimeout(waiter, 25);
            };
            waiter();
        });
    }
}
