import r6api from '../../r6api';

export default async (phrase: string, message): Promise<Object | null> => {
    if (!phrase) { return null; }

    if (/^[a-zA-Z][\w-.]{2,14}$/g.test(phrase) && !phrase.toLowerCase().startsWith('ubi_') && !phrase.toLowerCase().endsWith('_ubi')) {
        const profile = await r6api.findByName(phrase);
        if (profile.length) {
            return {
                nickname: phrase,
                genome: profile[0].userId
            }
        }
    }

    return null;
};
