import { Listener } from 'discord-akairo';

export default class UnhandledRejection extends Listener {
    public constructor() {
        super('unhandledRejection', {
            emitter: 'process',
            event: 'unhandledRejection',
        });
    }
    public exec(error) {
        // error reporting
        console.error(error);
    }
}
