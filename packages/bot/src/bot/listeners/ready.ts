import { Listener } from 'discord-akairo';
import ENV from '../../utils/env';
import { refresh } from '../../utils/r6api';
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
