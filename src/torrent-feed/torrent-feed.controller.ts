import { Controller, Get, Query } from "@nestjs/common";
import { MovieTfResponse, TfSource } from "./torrent-feed.data";
import { TorrentFeedService } from "./torrent-feed.service";

@Controller("api/torrent-feed")
export class TorrentFeedController {

    constructor(
        private readonly torrentFeedService: TorrentFeedService
    ) {}

    @Get("movies")
    public getMovies(
        @Query("query")
        query: string,
        @Query("page")
        page: number,
        @Query("limit")
        limit: number,
        @Query("sources")
        sources: TfSource[]
    ): Promise<MovieTfResponse> {
        return this.torrentFeedService.getMovies({
            query, page, limit, sources
        });
    }

}