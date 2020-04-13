import { DMReply } from '@r6ru/utils';
import { Command } from 'discord-akairo';
import 'reflect-metadata';

export default function RequireVoice<T extends Command, K extends keyof T>(
    target: Pick<T, keyof T>,
    propertyName: K,
    propertyDesciptor: TypedPropertyDescriptor<T['exec']>,
) {
    const method = propertyDesciptor.value;

    propertyDesciptor.value = async function (...args) {
        if (!args[0].member.voice.channelID) {
            return DMReply(args[0], 'Вы должны сначала зайти в голосовой канал!');
        }
        return method.apply(this, args);
    };

    return propertyDesciptor;
}
