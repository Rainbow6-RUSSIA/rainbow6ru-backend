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
        if (ENV.NODE_ENV === 'development') {
            console.log(data);
        }
    }
}
