import { Guild } from '@r6ru/db';
import { PLATFORM, VERIFICATION_LEVEL } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { TextChannel } from 'discord.js';
import { $enum } from 'ts-enum-util';
import { debug } from '../..';
import ENV from '../../utils/env';
import r6, { refresh } from '../../utils/r6api';
import Sync from '../../utils/sync';

export default class Ready extends Listener {
    public constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }

    public exec = async () => {
        console.log('[INFO][BOT] Logged as', this.client.user.tag);

        if (ENV.NODE_ENV !== 'development') {
            console.log('[INFO][BOT] Updating scheduled');
            this.startNickUpdating();
            this.startRankUpdating();
        }
    };

    private startRankUpdating = async () => {
        while (true) {
            try {
                await new Promise((resolve) => setTimeout(resolve, parseInt(ENV.COOLDOWN)));
                console.log('[INFO][BOT] Updating ranks...');
                await Sync.updateRoles();
            } catch (err) {
                refresh();
            }
        }
    };

    private startNickUpdating = async () => {
        while (true) {
            try {
                await new Promise((resolve) => setTimeout(resolve, parseInt(ENV.COOLDOWN)));
                console.log('[INFO][BOT] Updating membernames...');
                await Sync.updateMembernames();
            } catch (err) {
                refresh();
            }
        }
    };
}
