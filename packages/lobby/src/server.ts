import { Lobby } from '@r6ru/db';
import { IngameStatus as IS } from '@r6ru/types';
import { User } from 'discord.js';
import * as restify from 'restify';
import { BadRequestError, NotFoundError, PaymentRequiredError } from 'restify-errors';
import ENV from './utils/env';
import { lobbyStoresRooms } from './utils/lobby';
import { LSRoom } from './utils/lobby/room';
import { createEnhancedUserPreview, createLobbyPreview } from './utils/preview';

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

const lobbyGetterMiddleware = async (req: restify.Request & { data?: LSRoom }, res: restify.Response, next: restify.Next) => {
  if (Number.isInteger(parseInt(req.params.id)) && parseInt(req.params.id) < 2 ** 32 / 2) {
    const lobby = await Lobby.findByPk(req.params.id);

    if (!lobby) {
      return res.send(new NotFoundError());
    }

    const room = lobbyStoresRooms.get(lobby.channel);

    if (!room) {
      return res.redirect(301, 'https://i.imgur.com/5Neb9Sn.png', next);
    } else {
      req.data = room;
      next()
    }

  } else {
    return res.send(new BadRequestError());
  }
}

server.get('/lobby/:id/leader', lobbyGetterMiddleware, async (req: restify.Request & { data: LSRoom }, res, next) => {
  const room = req.data;

  if (!room.isEnhanced) res.send(new PaymentRequiredError())

  res.setHeader('Content-Type', 'image/gif');
  
  createEnhancedUserPreview(room.dcLeader.user, res);
  // createEnhancedUserPreview({ id: '261871531418845186', avatar: 'a_d89a473082eb25f2383e75e8e7d07d98' } as User, res);
})

server.get('/lobby/:id/preview', lobbyGetterMiddleware, async (req: restify.Request & { data: LSRoom }, res, next) => {
  const room = req.data;
  
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
});

server.listen(ENV.PORT || 3000, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));