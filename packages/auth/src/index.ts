import * as restify from 'restify';
import * as CORSMiddleware from 'restify-cors-middleware';
import ENV from './utils/env';

export function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

const cors = CORSMiddleware({
    origins: ENV.CORS_ORIGINS.split(','),
    allowHeaders: ['*'],
    exposeHeaders: ['*']
});

export const server = restify.createServer();

server.pre(cors.preflight);
server.use(cors.actual);
server.use(
    restify.plugins.throttle({
        burst: 100,
        ip: true,
        rate: 50,
    }),
);
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.requestLogger());

server.listen(ENV.PORT || 3333, () => console.log(`[INFO][GENERIC] ${server.name} listening at ${server.url}`));

import('./endpoints')