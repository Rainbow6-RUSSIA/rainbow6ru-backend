import 'reflect-metadata';
import { debug } from '../..';
import { LobbyStore } from '../../bot/lobby';

export default function Ratelimiter(target: LobbyStore, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(...args: any[]) {
            try {
                const result = await method.apply(this, args);
                if (this.actionCounter.has(args[0].id)) {
                    this.actionCounter.get(args[0].id).times++;
                } else {
                    this.actionCounter.set(args[0].id, {
                        kicked: false,
                        member: args[0],
                        times: 1,
                        warned: false,
                    });
                }
                return result;
            } catch (err) {
                debug.error(err);
            }
        };
        return propertyDesciptor;
}
