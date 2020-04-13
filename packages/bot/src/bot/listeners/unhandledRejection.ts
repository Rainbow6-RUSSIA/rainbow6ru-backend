import { Listener } from 'discord-akairo';
import { debug } from '../..';
import { refresh } from '../../utils/r6api';

export default class UnhandledRejection extends Listener {
    public constructor() {
        super('unhandledRejection', {
            emitter: 'process',
            event: 'unhandledRejection',
        });
    }

    public exec = async (error: Error) => {
        if (
            !error.message.includes('CODE') &&
            ['Creds not found on login', 'too many requests', 'Callback must be a function'].some((t) =>
                error.message.includes(t),
            )
        ) {
            console.log(error);
            return refresh();
        }
        debug.error(error);
    };
}
