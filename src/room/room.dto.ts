import { MediaResponse } from "src/media/media.data";
import { SeasonResponse } from "src/season/season.dto";
import { TvShowResponse } from "src/tv-show/tv-show.dto";
import { Room } from "./room.schema";

export interface RoomResponse {
    roomId: string;
    usernames: string[];
    owner: string;
    lastTimeWatched: Date;
}

export function roomAsResponse(room: Room): RoomResponse {
    return {
        roomId: room.roomId,
        usernames: room.users?.map(({ username }) => username),
        owner: room.owner?.username,
        lastTimeWatched: room.lastTimeWatched
    };
}

export interface RoomWithMediaResponse extends RoomResponse {
    roomId: string;
    mediaLabel: string;
    usernames: string[];
    owner: string;
}

export function roomWithMediaAsResponse(room: Room, label: string): RoomWithMediaResponse {
    return {
        ...roomAsResponse(room),
        mediaLabel: label,
    };
}

export interface RoomDto {
    roomId: string;
    users: string[];
    currentTime: number;
    mediaId: string;
}

export interface TvShowForRoom {
    tvShow: TvShowResponse;
    season: SeasonResponse;
    media: MediaResponse;
    room: RoomResponse;
}