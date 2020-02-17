import { Room } from '.'

export class CustomRoom extends Room {
    public from = CustomRoom.from;
    static from<LT extends Room>(lobby: LT): CustomRoom {
        if (lobby instanceof CustomRoom) {
            return lobby
        }

    }
    
    public generateAppeal() {
        return {};
    }
    
}