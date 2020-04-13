import { Listener } from 'discord-akairo';

export default class Debug extends Listener {
    public constructor() {
        super('debug', {
            emitter: 'client',
            event: 'debug',
        });
    }

    public exec = async (data: string) => {
        if (process.env.DISCORD_DEBUG === 'true') {
            console.log(data);
        }
    };
}
