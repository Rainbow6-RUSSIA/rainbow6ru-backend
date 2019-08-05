import { Listener } from 'discord-akairo';
import { initLobbyStores } from '../lobby';

export default class Ready extends Listener {
    public constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }

    public exec = async () => {
        console.log('[INFO][BOT] Logged as', this.client.user.tag);

        await initLobbyStores();

    }

}
