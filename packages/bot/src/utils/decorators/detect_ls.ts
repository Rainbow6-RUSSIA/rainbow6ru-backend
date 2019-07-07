import { Guild } from '@r6ru/db';
import { Inhibitor } from 'discord-akairo';
import 'reflect-metadata';

export default function DetectLS<T extends Inhibitor, K extends keyof T>(target: Pick<T, keyof T>, propertyName: K, propertyDesciptor: TypedPropertyDescriptor<T['exec']>) {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(...args) {
            const message = args[0];
            if (message.type === 'DEFAULT'
                && message.channel.type === 'text'
                && Object.values((await Guild.findByPk(message.guild.id)).lfgChannels).includes(message.channel.id)) {
                return method.apply(this, args);
            } else {
                return false;
            }
        };

        return propertyDesciptor;
}
