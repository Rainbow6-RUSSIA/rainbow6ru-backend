import 'reflect-metadata';
import { debug } from '../..';

export default function WaitLoaded<T>(target: T, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
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
