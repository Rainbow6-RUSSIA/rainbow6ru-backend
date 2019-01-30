import { Match } from '@r6ru/db';
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
        socket.join(e.room);
        socket.emit(e.room, await Match.findByPk(e.id));
    });
    // // socket.on('disconnect', () => {});
    // socket.on('my other event', (data) => {
    //     console.log(data);
    // });
});

server.listen(process.env.PORT || 3001, () => console.log(`${server.name} listening at ${server.url}`));

export default server;
