export interface RoomResponse {
    roomId: string;
    usernames: string[];
}

export interface RoomDto {
    roomId: string;
    users: string[];
    tracks: string[];
    currentTime: number;
}