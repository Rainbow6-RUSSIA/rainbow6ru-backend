import { UUID } from '@r6ru/types';
import { Message } from 'discord.js';

export default (message: Message, phrase: string): UUID | null => {
    if (!phrase) { return null; }
    return /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi.test(phrase)
        ? phrase : null;
};
