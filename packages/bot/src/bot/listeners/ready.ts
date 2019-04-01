import { Listener } from 'discord-akairo';

import { Guild } from '@r6ru/db';
import { PLATFORM, VERIFICATION_LEVEL } from '@r6ru/types';
import { $enum } from 'ts-enum-util';
import r6 from '../../r6api';
import ENV from '../../utils/env';
import { syncNicknames, syncRoles } from '../../utils/sync';

export default class Ready extends Listener {
    public constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }
    public async exec() {
        console.log('[BOT] Logged as', this.client.user.tag);

        // some Rainbow6-RUSSIA specific code
        Guild.upsert<Guild>({
            fixAfter: 20,
            id: '414757184044531722',
            lfgChannels: {
                casual: '414773731060350977',
                custom: '466708124024176640',
                ranked: '414778250355539969',
            },
            logsChannel: '509437965068533780',
            platformRoles: {
                PC: '475994539866193920',
                PS4: '418702806112010247',
                XBOX: '418702985917628417',
            },
            premium: true,
            rankRoles: [
                '454274787783475230',
                '454274387462324234', '454274387462324234', '454274387462324234', '454274387462324234',
                '454274530278506509', '454274530278506509', '454274530278506509', '454274530278506509',
                '454274109317185556', '454274109317185556', '454274109317185556', '454274109317185556',
                '454274078111563776', '454274078111563776', '454274078111563776', '454274078111563776',
                '454274031101804564', '454274031101804564', '454274031101804564',
                '414765737190621184',
            ],
            requiredVerification: VERIFICATION_LEVEL.NONE,
            roomsRange: [10, 50],
            voiceCategories: {
                casual: '414760349783556106',
                custom: '414820154044710914',
                ranked: '414761479430995968',
            },
        });
        Guild.upsert<Guild>({
            fixAfter: 20,
            id: '216649610511384576',
            lfgChannels: {
                ranked: '505831870735319055',
            },
            platformRoles: {
                PC: '473980291430613002',
                PS4: '473980295196966922',
                XBOX: '473980297738846222',
            },
            premium: true,
            rankRoles: [
                '330802325172125696',
                '', '', '', '',
                '', '', '', '',
                '', '', '', '',
                '416308534066675713', '416308534066675713', '416308534066675713', '416308534066675713',
                '', '', '',
                '416308522020765697',
            ],
            roomsRange: [1, 10],
            voiceCategories: {
                ranked: '505831824765747230',
            },
        });

        if (ENV.NODE_ENV !== 'development') {
            console.log('[BOT] Updating scheduled');
            this.startNickUpdating();
            this.startRankUpdating();
        }

    }
    private async startRankUpdating() {
        while (true) {
            try {
                await new Promise((resolve) => setTimeout(resolve, parseInt(ENV.COOLDOWN)));
                console.log('[BOT] Updating ranks...');
                await syncRoles();
                // console.log('[BOT] Updating ranks done');
            } catch (err) {
                r6.auth.login();
                console.log(err);
            }
        }
    }
    private async startNickUpdating() {
        while (true) {
            try {
                await new Promise((resolve) => setTimeout(resolve, parseInt(ENV.COOLDOWN)));
                console.log('[BOT] Updating nicknames...');
                await Promise.all($enum(PLATFORM).getValues().map((p) => syncNicknames(p)));
                // console.log('[BOT] Updating nicknames done');
            } catch (err) {
                r6.auth.login();
                console.log(err);
            }
        }
    }
}
