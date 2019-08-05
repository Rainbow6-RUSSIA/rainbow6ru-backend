import * as restify from 'restify';
import { NotFoundError } from 'restify-errors';
import bot from './bot';
import ENV from './utils/env';

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

server.listen(ENV.PORT || 3000, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));
