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
        if (error.message.includes('Creds not found on login')) {
            refresh();
        }
        debug.error(error);
    }
}
