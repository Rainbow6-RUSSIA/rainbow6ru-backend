import { Listener } from 'discord-akairo';
import { initLobbyStores } from '../../utils/lobby';
import { debug } from '../..';

export default class Ready extends Listener {
    public constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }

    public exec = async () => {
        console.log('[INFO][BOT] Logged as', this.client.user.tag);

        await new Promise(res => setTimeout(res, parseInt(process.env.READY_TIMEOUT)));

        const unavGuilds = this.client.guilds.filter(g => !g.available);
        if (unavGuilds.size) {
            try {
                debug.error(`${unavGuilds.size} серверов недоступны`);
            } catch (error) {/* */}
        }
        console.log(this.client.guilds.map(g => {
            const {members, channels, emojis, roles, voiceStates, presences, ...other} = g;
            return other;
        }));

        await initLobbyStores();

    }

}
