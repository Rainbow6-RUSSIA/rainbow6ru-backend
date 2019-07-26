import 'reflect-metadata';
import { debug } from '../..';
import { LobbyStore } from '../../bot/lobby';

export default function WaitLoaded(target: LobbyStore, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
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
