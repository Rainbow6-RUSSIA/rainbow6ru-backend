import { UUID } from '@r6ru/types';
import { Message } from 'discord.js';

export default (message: Message, phrase: string): UUID | null => {
    if (!phrase) { return null; }
    const results = /[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}/i.exec(phrase);
    return results && results[0];
};
