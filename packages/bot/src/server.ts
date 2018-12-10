import * as restify from 'restify';
import { ENV } from './utils/types';

function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
  }

export const server = restify.createServer();

server.use(restify.plugins.throttle({
    burst: 100,
    rate: 50,
    ip: true
  }));
server.use(restify.plugins.bodyParser())

server.get('/auth/login', respond);

server.listen(ENV.PORT || 3000, () => console.log(`${server.name} listening at ${server.url}`));
