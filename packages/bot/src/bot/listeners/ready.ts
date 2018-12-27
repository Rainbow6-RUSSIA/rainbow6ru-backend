import { Listener } from 'discord-akairo';

import { Guild } from '../../models/Guild';

export default class Ready extends Listener {
    public constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready',
        });
    }
    public async exec() {
        console.log('[BOT] Logged as', this.client.user.tag);

        // some Rainbow6-RUSSIA specific code
        const GInst = Guild.upsert({
            id: '216649610511384576',
            fixAfter: 20,
            rankRoles: [
                '416308522020765697',
                '330802325172125696',
            ],
            platformRoles: {
                PC: '473980291430613002',
                PS4: '473980295196966922',
                XBOX: '473980297738846222',
            },
            premium: true,
        });

    }
}
