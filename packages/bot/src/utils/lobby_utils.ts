import { Guild, Lobby, User } from '@r6ru/db';
import { ILobbyStoreEventType, IngameStatus, LobbyStoreStatus as LSS, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS } from '@r6ru/types';
import { CategoryChannel, GuildMember, Presence, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import 'reflect-metadata';
import * as uuid from 'uuid/v4';
import { debug } from '..';
import { LobbyStore } from '../bot/lobby';
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
    public lobbies: Lobby[];
    public voices: VoiceChannel[];
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

export function WaitLoaded(target: LobbyStore, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
    const method = propertyDesciptor.value;

    propertyDesciptor.value = async function(...args: any[]) {
        try {
            await this.waitLoaded();
            const result = await method.apply(this, args);
            return result;
        } catch (err) {
            debug.error(err);
        }
    };
    return propertyDesciptor;
}

export function Atomic(target: LobbyStore, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
    const method = propertyDesciptor.value;

    propertyDesciptor.value = async function(...args: any[]) {
        try {
            if (args[0] instanceof GuildMember) {
                args[0] = (await Promise.all([args[0].fetch(), this.waitReady()]))[0];
            } else {
                await this.waitReady();
            }
            console.log('Atomic +', propertyName);
            const id = uuid();
            this.promiseQueue.push(id);
            const result = await method.apply(this, args);
            this.promiseQueue = this.promiseQueue.filter((i) => i !== id);
            console.log('Atomic -', propertyName);
            return result;
        } catch (err) {
            debug.error(err);
        }
    };
    return propertyDesciptor;
}

export function Ratelimiter(eventType: ILobbyStoreEventType) {
    return (target: LobbyStore, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor => {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(...args: any[]) {
            try {
                const result = await method.apply(this, args);
                this.addEvent({
                    member: args[0],
                    type: eventType,
                    voice: args[1],
                });
                if (eventType === 'move') {
                    this.addEvent({
                        member: args[0],
                        type: 'move',
                        voice: args[2],
                    });
                }
                return result;
            } catch (err) {
                debug.error(err);
            }
        };
        return propertyDesciptor;
    };
}
