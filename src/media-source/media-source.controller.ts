import { Controller, Get, Query } from "@nestjs/common";
import { mediaAsResponse, MediaResponse } from "src/media/media.data";
import { torrentAsResponse, TorrentResponse } from "src/torrent-client/torrent-client.data";
import { MediaSourceService } from "./media-source.service";

@Controller("/api/media-source")
export class MediaSourceController {

    constructor(
        private readonly mediaSourceService: MediaSourceService
    ) { }

    @Get("media-by-torrent")
    public async getMediaByTorrent(
        @Query("id")
        id: string
    ): Promise<MediaResponse> {
        const media = await this.mediaSourceService.getMediaByTorrent(id);
        return mediaAsResponse(media);
    }

    @Get("torrent-by-media")
    public async getTorrentByMedia(
        @Query("id")
        id: string
    ): Promise<TorrentResponse> {
        const torrent = await this.mediaSourceService.getTorrentByMedia(id);
        return torrentAsResponse(torrent);
    }

}