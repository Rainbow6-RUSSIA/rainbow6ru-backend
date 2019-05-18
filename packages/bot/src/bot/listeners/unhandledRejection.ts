import { Listener } from 'discord-akairo';
import { debug } from '../..';
import { refresh } from '../../r6api';

export default class UnhandledRejection extends Listener {
    public constructor() {
        super('unhandledRejection', {
            emitter: 'process',
            event: 'unhandledRejection',
        });
    }

    public exec = async (error: Error) => {
        if (['Creds not found on login', 'too many requests', '[ERR_INVALID_CALLBACK]: Callback must be a function'].some((t) => error.message.includes(t))) {
            refresh();
        }
        debug.error(error);
    }
}
