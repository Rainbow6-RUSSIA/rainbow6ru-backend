import { Listener } from 'discord-akairo';
import { User } from '@r6ru/db';

class ReadyListener extends Listener {
    constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready'
        });
    }

    public exec() {
        console.log('[BOT] I\'m ready!');
    }
}

export default ReadyListener;