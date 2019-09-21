import { IngameStatus as IS } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { Presence } from 'discord.js';
import { lobbyStoresRooms } from '../../utils/lobby';

export default class PresenceUpdate extends Listener {
    public constructor() {
        super('presenceUpdate', {
            emitter: 'client',
            event: 'presenceUpdate',
        });
    }

    public exec = async (_: Presence, newPresence: Presence) => {
        const room = lobbyStoresRooms.get(newPresence.member.voice.channelID);
        if (room && room.status !== IS.LOADING) {
            console.log('PROCESS STATUS');
        }
    }
}

/*
public refreshIngameStatus = async (lobby: LSRoom) => {
        const statuses = lobby.dcMembers.map(m => LobbyStore.detectIngameStatus(m.presence)).filter(is => is !== IS.OTHER);
        statuses.unshift(IS.OTHER);
        const s = lobby.status;
        lobby.status = statuses.reduce((acc, el) => {
            acc.k[el] = acc.k[el] ? acc.k[el] + 1 : 1;
            acc.max = acc.max ? acc.max < acc.k[el] ? el : acc.max : el;
            return acc;
          }, { k: {}, max: null }).max;
        if (s !== lobby.status && ![s, lobby.status].includes(IS.OTHER)) {
            const start = [[IS.CASUAL_SEARCH, IS.CASUAL], [IS.RANKED_SEARCH, IS.RANKED]];
            const stop = [[IS.CASUAL, IS.MENU], [IS.RANKED, IS.MENU]];
            if (stop.some(t => JSON.stringify(t) === JSON.stringify([s, lobby.status]))) {
                debug.log(`<@${lobby.members.map(m => m.id).join('>, <@')}> закончили играть (\`${IS[s]} --> ${IS[lobby.status]}\`). ID пати \`${lobby.id}\``);
            }
            if (start.some(t => JSON.stringify(t) === JSON.stringify([s, lobby.status]))) {
                debug.log(`<@${lobby.members.map(m => m.id).join('>, <@')}> начали играть (\`${IS[s]} --> ${IS[lobby.status]}\`). ID пати \`${lobby.id}\``);
            }
            if (JSON.stringify(stop[1]) === JSON.stringify([s, lobby.status])) {
                lobby.members.forEach(m => {
                    m.rankUpdatedAt = new Date('2000');
                    m.save();
                });
            }
        }
    }
*/
