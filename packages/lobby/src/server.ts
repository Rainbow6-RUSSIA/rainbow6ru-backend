import { Lobby } from '@r6ru/db';
import { IngameStatus as IS } from '@r6ru/types';
import * as restify from 'restify';
import { BadRequestError, NotFoundError } from 'restify-errors';
import ENV from './utils/env';
import { lobbyStoresRooms } from './utils/lobby';
import { LSRoom } from './utils/lobby/room';
import { createLobbyPreview } from './utils/preview';

function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

export const server = restify.createServer();

server.use(
    restify.plugins.throttle({
        burst: 100,
        ip: true,
        rate: 50,
    }),
);
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.requestLogger());

server.get('/auth/login', respond);

server.get('/lobby/:id/preview', async (req, res, next) => {
    if (Number.isInteger(parseInt(req.params.id)) && parseInt(req.params.id) < 2 ** 32 / 2) {
        const lobby = await Lobby.findByPk(req.params.id);

        if (!lobby) {
            return next(new NotFoundError());
        }

        const room = lobbyStoresRooms.get(lobby.channel);

        if (!room) {
            return res.redirect(301, 'https://i.imgur.com/5Neb9Sn.png', next);
        } else {
            // await waitLoaded(room);
            const pic = await createLobbyPreview(
                room.minRank,
                room.maxRank,
                !room.joinAllowed ? room.dcChannel.userLimit - room.dcMembers.size : 0,
            );

            return res.sendRaw(200, pic || 'Error', {
                'Content-Disposition': `inline; filename="preview-${req.id().split('-')[0]}.png"`,
                'Content-Type': 'image/png',
            });
        }
    } else {
        return next(new BadRequestError());
    }
});

server.listen(ENV.PORT || 3000, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));

// async function waitLoaded(room: LSRoom) {
//   return new Promise(resolve => {
//       const waiter = () => {
//           if (room.status !== IS.LOADING) { return resolve(); }
//           setTimeout(waiter, 25);
//       };
//       waiter();
//   });
// }
