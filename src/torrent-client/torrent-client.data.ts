import { Torrent, TorrentState } from "./torrent.schema";

export interface TorrentResponse {
    id: string;
    infoHash: string;
    name: string;
    progress: number;
    state: TorrentState;
    speed: number;
    fileName: string;
}

export function torrentAsResponse(torrent: Torrent): TorrentResponse {
    return {
        id: torrent._id,
        infoHash: torrent.infoHash,
        name: torrent.name,
        progress: torrent.progress,
        state: torrent.state,
        speed: torrent.speed,
        fileName: torrent.file.name
    };
}