import { IngameStatus as IS, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { Collection, Presence } from 'discord.js';
import { debug } from '../..';
import ReverseThrottle from '../../utils/decorators/reverse_throttle';
import ENV from '../../utils/env';
import { lobbyStoresRooms } from '../../utils/lobby';
import { LSRoom } from '../../utils/lobby/room';

export const detectIngameStatus = (presence: Presence): IS  => {
    if (!presence) { return IS.OTHER; }

    const { activity } = presence;

    return activity && activity.applicationID === R6_PRESENCE_ID
        ? R6_PRESENCE_REGEXPS.findIndex(ar => ar.some(r => r.test(activity.details)))
        : IS.OTHER;
};

export const start = [
    [IS.CASUAL_SEARCH, IS.CASUAL],
    [IS.RANKED_SEARCH, IS.RANKED],
    [IS.NEWCOMER_SEARCH, IS.NEWCOMER],
    [IS.DISCOVERY_SEARCH, IS.DISCOVERY],
    [IS.UNRANKED_SEARCH, IS.UNRANKED],
];

export default class PresenceUpdate extends Listener {
    public constructor() {
        super('presenceUpdate', {
            emitter: 'client',
            event: 'presenceUpdate',
        });
    }

    public exec(oldPresence: Presence, newPresence: Presence) {
        const room = lobbyStoresRooms.get(newPresence.member.voice.channelID);
        // if (!room || room.status === IS.LOADING || !room.dcMembers.size) { return; }

        const [prev, next] = [detectIngameStatus(oldPresence), detectIngameStatus(newPresence)];
        if (!room || prev === next) { return; }

        return room.handleStatus();
    }
}
