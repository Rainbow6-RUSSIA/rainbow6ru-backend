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

server.use(restify.plugins.throttle({
    burst: 100,
    ip: true,
    rate: 50,
  }));
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.requestLogger());

server.get('/auth/login', respond);

server.get('/lobby/:id/preview', async (req, res, next) => {
  if (Number.isInteger(parseInt(req.params.id))) {
    const room = lobbyStoresRooms.get(req.params.id);
    // const lobbyBase = await Lobby.findByPk(parseInt(req.params.id)/* , { include: [{ all: true }] } */);

    if (!room) {
      return next(new NotFoundError());
    } else {
      await waitLoaded(room);
      const pic = await createLobbyPreview(
        room.minRank,
        room.maxRank,
        (!room.joinAllowed
          ? room.dcChannel.userLimit - room.dcMembers.size
          : 0));

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

async function waitLoaded(room: LSRoom) {
  return new Promise(resolve => {
      const waiter = () => {
          if (room.status !== IS.LOADING) { return resolve(); }
          setTimeout(waiter, 25);
      };
      waiter();
  });
}
