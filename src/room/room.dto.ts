import { Room } from "./room.schema";

export interface RoomResponse {
    roomId: string;
    usernames: string[];
    owner: string;
}

export function roomAsResponse(room: Room): RoomResponse {
    return {
        roomId: room.roomId,
        usernames: room.users?.map(({ username }) => username),
        owner: room.owner?.username
    };
}

export interface RoomWithMediaResponse extends RoomResponse {
    roomId: string;
    mediaLabel: string;
    usernames: string[];
    owner: string;
}

export function roomWithMediaAsResponse(roomResponse: RoomResponse, label: string): RoomWithMediaResponse {
    return {
        roomId: roomResponse.roomId,
        usernames: roomResponse.usernames,
        mediaLabel: label,
        owner: roomResponse.owner
    };
}

export interface RoomDto {
    roomId: string;
    users: string[];
    currentTime: number;
    mediaId: string;
}