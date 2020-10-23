import * as restify from 'restify';
import { InternalServerError, NotFoundError, PaymentRequiredError } from 'restify-errors';
import bot from './bot';
import ENV from './utils/env';
import { lobbyStoresRooms } from './utils/lobby';
import { createEnhancedUserPreview, createLobbyPreview } from './utils/preview';

const gitInfo = require('git-commit-info');
const versionHash = gitInfo().shortHash;

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

server.get(`/v${versionHash}/leader/:id/preview.gif`, async (req, res) => {
  const user = bot.users.get(req.params.id);
  if (!user) return res.send(new NotFoundError());
  
  const room = lobbyStoresRooms.find(r => r.members.findIndex(m => m.id === user.id) !== -1);
  if (!room) return res.send(new NotFoundError());

  if (!room.isEnhanced) return res.send(new PaymentRequiredError())

  res.setHeader('Content-Disposition',`inline; filename="preview-${req.id().split('-')[0]}.gif"`);
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', `max-age=${1 * 24 * 3600}`);
  
  try {
    createEnhancedUserPreview(user, res);
    // createEnhancedUserPreview({ id: '261871531418845186', avatar: 'a_d89a473082eb25f2383e75e8e7d07d98' } as User, res);
    // createEnhancedUserPreview({ id: '125634283258773504', avatar: '175220b1bbde18ab5a10f924c5285712' } as User, res);
  } catch (error) {
    return res.send(new InternalServerError())
  }
})

server.get(`/v${versionHash}/lobby/:n/:m/:k/preview.png`, async (req, res) => {
  const { n, m, k } = req.params;
  
  const pic = await createLobbyPreview(parseInt(n), parseInt(m), parseInt(k));
  res.setHeader('Content-Disposition',`inline; filename="preview-${req.id().split('-')[0]}.png"`);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', `max-age=${30 * 24 * 3600}`);
  return res.sendRaw(200, pic || 'Error');
});

server.listen(ENV.PORT || 3000, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));