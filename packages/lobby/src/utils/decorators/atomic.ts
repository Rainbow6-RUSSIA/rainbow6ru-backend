import { GuildMember } from 'discord.js';
import 'reflect-metadata';
import * as uuid from 'uuid/v4';
import { debug } from '../..';
import { LobbyStore } from '../../bot/lobby';

export default function Atomic(target: LobbyStore, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
    const method = propertyDesciptor.value;

    propertyDesciptor.value = async function(...args: any[]) {
        try {
            if (args[0] instanceof GuildMember) {
                args[0] = (await Promise.all([args[0].fetch(), this.waitReady()]))[0];
            } else {
                await this.waitReady();
            }
            const id = uuid();
            this.promiseQueue.push(id);
            const result = await method.apply(this, args);
            this.promiseQueue = this.promiseQueue.filter(i => i !== id);
            return result;
        } catch (err) {
            debug.error(err);
        }
    };
    return propertyDesciptor;
}
