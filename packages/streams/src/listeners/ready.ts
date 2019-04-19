import { Listener } from 'discord-akairo';

class ReadyListener extends Listener {
    constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }

    public exec() {
        console.log('[BOT] Logged as', this.client.user.tag);
    }
}

export default ReadyListener;
