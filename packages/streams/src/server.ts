import * as restify from 'restify';

const server = restify.createServer();

server.get('/', (req, res, next) => {
    res.send(200, {status: 'Online'});
    
});

server.listen(process.env.PORT || 3001, () => console.log(`${server.name} listening at ${server.url}`))

export default server;