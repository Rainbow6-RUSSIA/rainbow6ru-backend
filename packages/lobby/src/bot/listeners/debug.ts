import { Listener } from 'discord-akairo';
import { GuildMember, Presence } from 'discord.js';
import ENV from '../../utils/env';
import { LobbyStore, lobbyStores } from '../lobby';

export default class Debug extends Listener {
    public constructor() {
        super('debug', {
            emitter: 'client',
            event: 'debug',
        });
    }

    public exec = async (data: string) => {
        if (ENV.NODE_ENV === 'development') {
            console.log(data);
        }
    }
}
