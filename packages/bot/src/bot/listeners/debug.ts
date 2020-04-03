import { Listener } from 'discord-akairo';
import ENV from '../../utils/env';

export default class Debug extends Listener {
    public constructor() {
        super('debug', {
            emitter: 'client',
            event: 'debug',
        });
    }

    public exec = async (data: string) => {
        if (process.env.DISCORD_DEBUG === 'true') {
            console.log(data);
        }
    }
}
