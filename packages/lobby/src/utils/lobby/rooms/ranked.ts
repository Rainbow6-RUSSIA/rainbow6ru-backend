import { Room } from '.';

export class RankedRoom extends Room {
    public from = RankedRoom.from;
    static from<LT extends Room>(lobby: LT): RankedRoom {
        if (lobby instanceof RankedRoom) {
            return lobby;
        }
    }

    public generateAppeal() {
        return {};
    }

    public async join() {
        super.join();
    }

    public async leave() {
        super.leave();
    }
}
