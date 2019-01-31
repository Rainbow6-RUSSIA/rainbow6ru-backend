import { MapR6, Match, Team, User, Vote } from '@r6ru/db';
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

io.sockets.on('connection', (socket) => {
    socket.emit('status', { status: 'Online' });
    socket.on('subscribe', async (e: ISub) => { // header/#id; map_vote/#id
        // socket.emit('status', { status: 'Online' });
        if (!e.id || !e.room) { return; }
        console.log('Moving new listener to', e.id + '/' + e.room);
        socket.join(e.id + '/' + e.room);
        const match = await Match.findByPk(e.id, {include: [MapR6, Vote, User, Team]});
        socket.emit('init', match.toJSON());
    });
    // // socket.on('disconnect', () => {});
    // socket.on('my other event', (data) => {
    //     console.log(data);
    // });
});

server.listen(process.env.PORT || 3001, () => console.log(`${server.name} listening at ${server.url}`));

export default server;
