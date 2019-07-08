import { Command, Inhibitor } from 'discord-akairo';
import { Message } from 'discord.js';
import DetectLS from '../../utils/decorators/detect_ls';
import ENV from '../../utils/env';

export default class LobbyMode extends Inhibitor {
    constructor() {
        super('lobby_mode', {
            reason: 'lobby_mode',
        });
    }

    public async exec(message: Message, cmd: Command) {
        return (ENV.LOBBY_MODE === 'only' && !['party', 'stats'].includes(cmd.categoryID)) || (ENV.LOBBY_MODE === 'off' && cmd.categoryID === 'party');
    }
}
