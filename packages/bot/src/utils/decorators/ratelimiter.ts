import { ILobbyStoreEventType } from '@r6ru/types';
import 'reflect-metadata';
import { debug } from '../..';
import { LobbyStore } from '../../bot/lobby';

export default function Ratelimiter(eventType: ILobbyStoreEventType) {
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
