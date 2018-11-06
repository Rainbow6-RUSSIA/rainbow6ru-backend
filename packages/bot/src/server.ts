import * as restify from 'restify';

// function respond(req, res, next) {
//     res.send('hello ' + req.params.name);
//     next();
//   }

export const server = restify.createServer();

server.listen(process.env.PORT || 3000, () => console.log(`${server.name} listening at ${server.url}`));
