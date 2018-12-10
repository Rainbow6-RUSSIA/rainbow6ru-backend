import r6api from '../../r6api';
import { IUbiBound } from '../../utils/types';

export default async (phrase: string): Promise<IUbiBound | null> => {
    if (!phrase) { return null; }

    if (/^[a-zA-Z][\w-.]{2,14}$/g.test(phrase) && !phrase.toLowerCase().startsWith('ubi_') && !phrase.toLowerCase().endsWith('_ubi')) {
        try {
            const profile = await r6api.findByName(phrase);
            if (profile.length) {
                return {
                    nickname: phrase,
                    genome: profile[0].userId
                }
            }
        } catch (err) {
            return { err }
        }
    }

    return null;
};
