import { IUbiBound, PLATFORM } from '@r6ru/types';
import { Message } from 'discord.js';
import { $enum } from 'ts-enum-util';
import r6api from '../../r6api';

export default async (message: Message, phrase: string): Promise<IUbiBound[] | null | Error> => {
    if (!phrase) { return null; }

    if (/^[a-zA-Z][\w-.]{2,14}$/g.test(phrase) && !phrase.toLowerCase().startsWith('ubi_') && !phrase.toLowerCase().endsWith('_ubi')) {
        try {
            const platforms = $enum(PLATFORM).getValues();
            const profiles = (await Promise.all(platforms.map((p) => r6api.api.findByName(p, phrase)))).map((p, i) => ({profile: Object.values(p)[0], platform: platforms[i]})).filter((p) => p.profile);
            console.log(profiles);
            if (profiles.length) {
                return profiles.map((p) => ({
                    genome: p.profile.id,
                    nickname: p.profile.name,
                    platform: p.platform,
                }));
            }
        } catch (err) {
            return err;
        }
    }

    return null;
};
