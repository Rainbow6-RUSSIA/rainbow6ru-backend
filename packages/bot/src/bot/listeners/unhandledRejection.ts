import { TryCatch } from '@r6ru/utils';
import { Listener } from 'discord-akairo';
import { debug } from '../..';

export default class UnhandledRejection extends Listener {
    public constructor() {
        super('unhandledRejection', {
            emitter: 'process',
            event: 'unhandledRejection',
        });
    }

    @TryCatch(debug)
    public exec = async (error) => {
        // error reporting
        throw error;
    }
}
