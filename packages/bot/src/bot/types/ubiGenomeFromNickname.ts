import { IUbiBound, PLATFORM } from '@r6ru/types';
import { $enum } from 'ts-enum-util';
import r6api from '../../r6api';

export default async (phrase: string): Promise<IUbiBound | null> => {
    if (!phrase) { return null; }

    if (/^[a-zA-Z][\w-.]{2,14}$/g.test(phrase) && !phrase.toLowerCase().startsWith('ubi_') && !phrase.toLowerCase().endsWith('_ubi')) {
        try {
            const platforms = $enum(PLATFORM).getValues();
            const profiles = (await Promise.all(platforms.map((p) => r6api.findByName(p, phrase)))).map((p, i) => ({profile: Object.values(p)[0], platform: platforms[i]})).filter((p) => p.profile);
            if (profiles.length) {
                return {
                    genome: profiles[0].profile.id,
                    nickname: profiles[0].profile.name,
                    platform: profiles[0].platform,
                };
            }
        } catch (err) {
            return { err };
        }
    }

    return null;
};
