import { Listener } from 'discord-akairo';
import { debug } from '../..';

export default class UnhandledRejection extends Listener {
    public constructor() {
        super('unhandledRejection', {
            emitter: 'process',
            event: 'unhandledRejection',
        });
    }

    public exec = async (error: Error) => {
        debug.error(error);
    };
}
