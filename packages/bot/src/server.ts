import { Lobby } from '@r6ru/db';
import { IngameStatus as IS, LobbyStoreStatus as LSS } from '@r6ru/types';
import { VoiceChannel } from 'discord.js';
import * as restify from 'restify';
import { NotFoundError } from 'restify-errors';
import bot from './bot';
import { LobbyStore, lobbyStores } from './bot/lobby';
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

if (ENV.LOBBY_MODE !== 'off') {
  server.get('/lobby/:id/preview', async (req, res, next) => {
    if (Number.isInteger(parseInt(req.params.id))) {
      const lobbyBase = await Lobby.findByPk(parseInt(req.params.id)/* , { include: [{ all: true }] } */);

      if (!lobbyBase) {return next(new NotFoundError()); }

      const dcChannel = bot.channels.get(lobbyBase.channel) as VoiceChannel;

      if (!dcChannel) {return next(new NotFoundError()); }

      const LS = lobbyStores.get(dcChannel.parentID);
      await waitLoaded(LS);

      const lobby = LS.lobbies.get(dcChannel.id);

      if (!lobby) {return next(new NotFoundError()); }

      const pic = await createLobbyPreview(
        lobby.minRank,
        lobby.maxRank,
        (![IS.CASUAL, IS.RANKED, IS.CUSTOM].includes(lobby.status) && lobby.dcChannel.members.size < lobby.dcChannel.userLimit
          ? lobby.dcChannel.userLimit - lobby.dcChannel.members.size
          : 0));

      return res.sendRaw(200, pic || 'Error', {
        'Content-Disposition': `inline; filename="preview-${req.id().split('-')[0]}.png"`,
        'Content-Type': 'image/png',
      });

    } else {
      return next(new NotFoundError());
    }
  });
}

server.listen(ENV.PORT || 3000, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));

async function waitLoaded(LS: LobbyStore) {
  return new Promise((resolve) => {
      const waiter = () => {
          if (LS.status === LSS.AVAILABLE) { return resolve(); }
          setTimeout(waiter, 25);
      };
      waiter();
  });
}
