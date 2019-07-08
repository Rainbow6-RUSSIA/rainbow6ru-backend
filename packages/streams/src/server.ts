import { MapR6, Match, Pool, Team, Tournament, User, Vote } from '@r6ru/db';
import * as restify from 'restify';
import * as socketio from 'socket.io';

const server = restify.createServer();
export const io = socketio.listen(server.server);

server.get('/', (req, res, next) => {
    res.send(200, {status: 'Online'});

});

interface ISub {
    id: number;
    room: string;
}

io.sockets.on('connection', socket => {
    socket.emit('status', { status: 'Online' });
    socket.on('subscribe', async (e: ISub) => { // #id/header; #id/map_vote
        if (!e.id || !e.room) { return; }
        console.log('Moving new listener to', e.id + '/' + e.room);
        socket.join(e.id + '/' + e.room);
        console.log('start eager loading');
        const match = await Match.findByPk(e.id, {include: [
            {all: true},
            // {model: Tournament, include: [
            //     {all: true},
            //     {model: MapR6, include: [{all: true}]},
            // ]},
            {model: Vote, include: [{all: true}]},
        ]});
        console.log('init sent');
        socket.emit('init', match && match.dataValues);
    });
});

server.listen(process.env.PORT || 3001, () => console.log(`${server.name} listening at ${server.url}`));

export default server;
