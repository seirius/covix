import { Module } from "@nestjs/common";
import { TorrentFeedController } from "./torrent-feed.controller";
import { TorrentFeedService } from "./torrent-feed.service";

@Module({
    providers: [TorrentFeedService],
    controllers: [TorrentFeedController]
})
export class TorrentFeedModule {}
