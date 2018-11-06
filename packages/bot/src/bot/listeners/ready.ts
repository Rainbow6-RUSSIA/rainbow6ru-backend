import { Listener } from 'discord-akairo';

export default class Ready extends Listener {
    constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }
    public exec() {
        console.log('Bot ready');
    }
}
