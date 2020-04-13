import { Room } from '.';

export class UntrackedRoom extends Room {
    public from = UntrackedRoom.from;
    static from<LT extends Room>(lobby: LT): UntrackedRoom {
        if (lobby instanceof UntrackedRoom) {
            return lobby;
        }
    }

    public generateAppeal() {
        return {};
    }
}
