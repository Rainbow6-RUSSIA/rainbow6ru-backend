import { Inhibitor } from 'discord-akairo';
import { TextChannel } from 'discord.js';
import 'reflect-metadata';
import { lobbyStores } from '../../bot/lobby';

export default function DetectLS<T extends Inhibitor, K extends keyof T>(target: Pick<T, keyof T>, propertyName: K, propertyDesciptor: TypedPropertyDescriptor<T['exec']>) {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(...args) {
            const message = args[0];
            if (message.type === 'DEFAULT'
                && message.channel.type === 'text'
                && (message.channel as TextChannel).parentID
                && lobbyStores.has((message.channel as TextChannel).parentID)) {
                return method.apply(this, args);
            } else {
                return false;
            }
        };

        return propertyDesciptor;
}
