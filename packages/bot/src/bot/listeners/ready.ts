import { Listener } from 'discord-akairo';

export default class Ready extends Listener {
    public constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }
    public exec() {
        console.log('Bot ready');

        // some Rainbow6-RUSSIA specific code
    }
}
