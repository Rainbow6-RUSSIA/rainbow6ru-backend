import { Guild } from '@r6ru/db';
import { Inhibitor } from 'discord-akairo';
import 'reflect-metadata';

export default function DetectLS<T extends Inhibitor, K extends keyof T>(target: Pick<T, keyof T>, propertyName: K, propertyDesciptor: TypedPropertyDescriptor<T['exec']>) {
        const method = propertyDesciptor.value;

        propertyDesciptor.value = async function(...args) {
            const message = args[0];
            if (message.type === 'DEFAULT' && message.channel.type === 'text') {
                const dbGuild = await Guild.findByPk(message.guild.id);
                if (dbGuild && dbGuild.lfgChannels && Object.values(dbGuild.lfgChannels).includes(message.channel.id)) {
                    return method.apply(this, args);
                }
            }
            return false;
        };

        return propertyDesciptor;
}
