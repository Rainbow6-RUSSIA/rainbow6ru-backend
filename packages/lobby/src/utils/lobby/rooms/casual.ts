import { Room } from '.'

export class CasualRoom extends Room {
    public from = CasualRoom.from;
    static from<LT extends Room>(lobby: LT): CasualRoom {
        if (lobby instanceof CasualRoom) {
            return lobby
        }

    }
    
    public generateAppeal() {
        return {};
    }
    
}