import { IUbiBound, PLATFORM } from '@r6ru/types';
import { Message } from 'discord.js';
import { $enum } from 'ts-enum-util';
import r6api from '../../r6api';

async function fetchProfiles(platforms: PLATFORM[], phrase: string) {
    if (!platforms.length) { return null; }
    const rawProfiles = await Promise.all(platforms.map(p => r6api.api.findByName(p, phrase)));
    const profiles = rawProfiles
        .map((p, i) => ({ profile: Object.values(p)[0], platform: platforms[i] }))
        .filter(p => p.profile)
        .map(p => ({
            genome: p.profile.id,
            nickname: p.profile.name,
            platform: p.platform,
        }));
    return profiles.length ? profiles : null;
}

export default /* (platform?: PLATFORM) =>  */async (message: Message, phrase: string): Promise<IUbiBound[] | null | Error> => {
    if (!phrase) { return null; }

    try {
        const platforms = /* platform ? [platform] : */ $enum(PLATFORM).getValues();

        if (!phrase.toLowerCase().startsWith('ubi_') && !phrase.toLowerCase().endsWith('_ubi')) {
            switch (true) {
                case /^[a-zA-Z][\w-._]{2,14}$/.test(phrase): return fetchProfiles(platforms, phrase);

                case /^[a-zA-Z][\w-._ ]{2,14}$/.test(phrase): return fetchProfiles(platforms.filter(p => p === PLATFORM.XBOX), phrase);
            }
        }
    } catch (error) {
        return error;
    }

    return null;
};

export type IUbiBoundType = IUbiBound[] | null | Error;
