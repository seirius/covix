export interface RoomResponse {
    roomId: string;
    usernames: string[];
}

export interface RoomDto {
    roomId: string;
    filename: string;
    users: string[];
    tracks: string[];
    currentTime: number;
}