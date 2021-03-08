export class RoomDto {
    username: string;
}

export class JoinRoomDto {
    username: string;
    id: string;
}

export class RoomResponse {
    id: string;
    users: string[];
}