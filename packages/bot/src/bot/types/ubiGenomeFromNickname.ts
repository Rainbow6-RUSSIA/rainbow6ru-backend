import { IUbiBound, PLATFORM, RANKS, REGIONS } from '@r6ru/types';
import { Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { $enum } from 'ts-enum-util';
import r6api from '../../r6api';

async function fetchProfiles(platforms: PLATFORM[], phrase: string) {
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

export default async (message: Message, phrase: string): Promise<IUbiBoundType | Flag> => {
    if (!phrase
        || $enum(REGIONS).isValue(phrase.toLowerCase())
        || $enum(RANKS).map(r => r.toString().toLowerCase().split(' ')[0]).some(r => r === phrase.toLowerCase())
    ) { return null; }

    try {
        const platforms = $enum(PLATFORM).getValues();
        if (!phrase.toLowerCase().startsWith('ubi_') && !phrase.toLowerCase().endsWith('_ubi')) {
            switch (true) {
                case /^[a-zA-Z][\w-._]{2,14}$/.test(phrase): return await fetchProfiles(platforms, phrase); // await errors

                case /^[a-zA-Z][\w-._ ]{2,14}$/.test(phrase): return await fetchProfiles(platforms.filter(p => p === PLATFORM.XBOX), phrase); // await errors
            }
        }
    } catch (error) {
        return error;
    }

    return null;
};

export type IUbiBoundType = IUbiBound[] | null | Error;
