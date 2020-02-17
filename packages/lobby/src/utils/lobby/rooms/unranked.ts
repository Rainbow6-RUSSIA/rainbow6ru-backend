import { Room } from '.'

export class UnrankedRoom extends Room {
    public from = UnrankedRoom.from;
    static from<LT extends Room>(lobby: LT): UnrankedRoom {
        if (lobby instanceof UnrankedRoom) {
            return lobby
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