import { Lobby } from '@r6ru/db';
import { IngameStatus as IS } from '@r6ru/types';
import { VoiceChannel } from 'discord.js';
import * as restify from 'restify';
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

server.get('/auth/login', respond);

server.get('/lobby/:id/preview', async (req, res) => {
  if (Number.isInteger(parseInt(req.params.id))) {
    const lobbyBase = await Lobby.findByPk(parseInt(req.params.id)/* , { include: [{ all: true }] } */);
    const dcChannel = bot.channels.get(lobbyBase.channel) as VoiceChannel;
    const lobby = lobbyStores.get(dcChannel.parentID).lobbies.find((l) => l.channel === dcChannel.id);
    const pic = await createLobbyPreview(
      Math.min(...lobby.members.map((m) => m.rank)),
      Math.max(...lobby.members.map((m) => m.rank)),
      (![IS.CASUAL, IS.RANKED, IS.CUSTOM].includes(lobby.status) && lobby.dcMembers.length < lobby.dcChannel.userLimit
        ? lobby.dcChannel.userLimit - lobby.dcMembers.length
        : 0));
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="preview-${req.id().split('-')[0]}.png"`);
    return res.send(pic);
  } else {
    return res.send();
  }
});

server.listen(ENV.PORT || 3000, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));
