import { Lobby } from '@r6ru/db';
import { IngameStatus as IS } from '@r6ru/types';
import { VoiceChannel } from 'discord.js';
import * as restify from 'restify';
import { NotFoundError } from 'restify-errors';
import bot from './bot';
import { lobbyStores } from './bot/lobby';
import ENV from './utils/env';
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
    const lobbyBase = await Lobby.findByPk(parseInt(req.params.id)/* , { include: [{ all: true }] } */);

    if (!lobbyBase) {return next(new NotFoundError()); }

    const dcChannel = bot.channels.get(lobbyBase.channel) as VoiceChannel;

    if (!dcChannel) {return next(new NotFoundError()); }

    const lobby = lobbyStores.get(dcChannel.parentID).lobbies.find((l) => l && l.channel === dcChannel.id);

    if (!lobby) {return next(new NotFoundError()); }

    const pic = await createLobbyPreview(
      Math.min(...lobby.members.map((m) => m.rank)),
      Math.max(...lobby.members.map((m) => m.rank)),
      (![IS.CASUAL, IS.RANKED, IS.CUSTOM].includes(lobby.status) && lobby.dcChannel.members.size < lobby.dcChannel.userLimit
        ? lobby.dcChannel.userLimit - lobby.dcChannel.members.size
        : 0));

    return res.sendRaw(200, pic, {
      'Content-Disposition': `inline; filename="preview-${req.id().split('-')[0]}.png"`,
      'Content-Type': 'image/png',
    });

  } else {
    return next(new NotFoundError());
  }
});

server.listen(ENV.PORT || 3000, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));
