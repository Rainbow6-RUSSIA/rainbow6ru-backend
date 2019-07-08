import { Guild, Lobby } from '@r6ru/db';
import { IActivityCounter, IngameStatus, LobbyStoreStatus as LSS, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS } from '@r6ru/types';
import { CategoryChannel, Collection, Presence, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import ENV from '../utils/env';

export class LSBase {
    public static detectIngameStatus = (presence: Presence): IngameStatus => {
        const { activity } = presence;
        if (activity && activity.applicationID === R6_PRESENCE_ID) {
            return R6_PRESENCE_REGEXPS.findIndex(ar => ar.some(r => r.test(activity.details)));
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
        return this.lobbies ? new Collection(this.lobbies.map(l => [l.dcChannel.id, l.dcChannel])) : this.rawVoices;
    }
    get rawVoices() {
        return this.category.children.filter(ch => ch.type === 'voice' && !ch.deleted) as Collection<Snowflake, VoiceChannel>;
    }
    public actionCounter: Collection<Snowflake, IActivityCounter>; // : Array<Partial<ILobbyStoreEvent>> = [];
    public status: LSS = LSS.LOADING;
    public promiseQueue = [];
    public roomSize: number = 5;
    public roomsRange: [number, number];
    public staticRooms: boolean;

    public waitReady = async () => {
        return new Promise(resolve => {
            const waiter = () => {
                if (!this.promiseQueue.length) { return resolve(); }
                setTimeout(waiter, 25);
            };
            waiter();
        });
    }

    public purgeActions = async () => {
        this.actionCounter.forEach((a, key, map) => {
            if (a.times < 2) {
                map.delete(key);
            } else {
                a.times--;
            }
        });
    }

    public waitLoaded = async () => {
        return new Promise(resolve => {
            const waiter = () => {
                if (this.status === LSS.AVAILABLE) { return resolve(); }
                setTimeout(waiter, 25);
            };
            waiter();
        });
    }
}
