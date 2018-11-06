import { Listener } from 'discord-akairo';

export default class UnhandledRejection extends Listener {
    public constructor() {
        super('unhandledRejection', {
            event: 'unhandledRejection',
            emitter: 'process',
        });
    }
    public exec(error) {
        // error reporting
        console.error(error);
    }
}
