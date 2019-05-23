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
        if (['Creds not found on login', 'too many requests', 'Callback must be a function'].some((t) => error.message.includes(t))) {
            return refresh();
        }
        debug.error(error);
    }
}
