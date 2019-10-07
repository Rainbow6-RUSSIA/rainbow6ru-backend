import { IngameStatus as IS, R6_PRESENCE_ID, R6_PRESENCE_REGEXPS } from '@r6ru/types';
import { Listener } from 'discord-akairo';
import { Collection, Presence } from 'discord.js';
import { debug } from '../..';
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

const start = [
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

    /*
    public static handle = async (room: LSRoom) => {
        if (room && room.status !== IS.LOADING && room.dcMembers.size) {
            const statusColl = new Collection<IS, number>();
            room.dcMembers.map(m => m.presence).map(detectIngameStatus).map(s => statusColl.set(s, (statusColl.get(s) || 0) + 1));
            statusColl.sort((a, b, ak, bk) => (b - a) || (bk - ak)); // sort by quantity otherwise sort by mode from actual mode to OTHER
            // if (statusColl.size <= 2 && statusColl.has(IS.OTHER)) {
            //     Object.values(room.LS.guild.lobbySettings);
            //     // move when playing incorrect mode
            // }
            const prevStatus = room.status;
            const nextStatus = statusColl.firstKey();
            if (prevStatus !== nextStatus) {
                console.log(IS[prevStatus], '-->', IS[nextStatus], statusColl);
                room.lastStatusUpdate = new Date();
                if (![prevStatus, nextStatus].includes(IS.OTHER)) {
                    if (start.some(t => t[0] === prevStatus && t[1] === nextStatus)) {
                        debug.log(`<@${room.members.map(m => m.id).join('>, <@')}> начали играть (\`${IS[prevStatus]} --> ${IS[nextStatus]}\`). ID пати \`${room.id}\``);
                    }

                    if (start.some(t => t[1] === prevStatus) && nextStatus === IS.MENU) {
                        debug.log(`<@${room.members.map(m => m.id).join('>, <@')}> закончили играть (\`${IS[prevStatus]} --> ${IS[nextStatus]}\`). ID пати \`${room.id}\``);
                    }

                    if (prevStatus === IS.RANKED && nextStatus === IS.MENU) {
                        room.members.map(m => {
                            m.rankUpdatedAt = new Date('2000');
                            m.save();
                        });
                    }
                }

                room.status = nextStatus;
                await Promise.all([
                    room.updateAppeal(),
                    room.LS.updateFastAppeal(),
                ]);
            }
        }
    } */

    public exec(oldPresence: Presence, newPresence: Presence) {
        const room = lobbyStoresRooms.get(newPresence.member.voice.channelID);
        const [prev, next] = [detectIngameStatus(oldPresence), detectIngameStatus(newPresence)];
        if (!room || prev === next) { return; }
        if (room.statusMap.has(newPresence.user.id)) {
            const [_, ___, timestamp, cooldown] = room.statusMap.get(newPresence.user.id);
            if ((Date.now() - timestamp.valueOf() < parseInt(ENV.MESSAGE_COOLDOWN)) && !cooldown) {
                room.statusMap.get(newPresence.user.id)[3] = true;
                return setTimeout(() => {
                    room.statusMap.set(newPresence.user.id, [prev, detectIngameStatus(newPresence.member.presence), new Date()]);
                    this.saveStatus(room);
                }, Date.now() - timestamp.valueOf());
            }
        }
        room.statusMap.set(newPresence.user.id, [prev, next, new Date()]);
        return this.saveStatus(room);
        // if (room.statusUpdateTimeout || (room.lastStatusUpdate.valueOf() > (Date.now() - parseInt(ENV.MESSAGE_COOLDOWN)))) {
        //     clearTimeout(room.statusUpdateTimeout);
        //     room.statusUpdateTimeout = setTimeout(() => (room.statusUpdateTimeout = null) || PresenceUpdate.handle(room), Date.now() - room.lastStatusUpdate.valueOf() + 1);
        // } else {
        //     await PresenceUpdate.handle(room);
        // }
    }

    public async saveStatus(room: LSRoom) {
        const prevStatus = room.status;
        const nextStatus = room.status;
        await room.save();

        console.log(room.statusMap);

        return Promise.all([
            room.updateAppeal(),
            room.LS.updateFastAppeal(),
        ]);
    }
}
