export class RoomDto {
    username: string;
}

export class JoinRoomDto {
    username: string;
    roomId: string;
}

export class LeaveRoomDto {
    username: string;
    roomId: string;
}

export class RoomResponse {
    id: string;
    users: string[];
}