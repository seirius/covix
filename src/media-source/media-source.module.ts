import { Module } from "@nestjs/common";
import { FileModule } from "src/file/file.module";
import { MediaModule } from "src/media/media.module";
import { TorrentClientModule } from "src/torrent-client/torrent-client.module";
import { MediaSourceController } from "./media-source.controller";
import { MediaSourceService } from "./media-source.service";

@Module({
    imports: [
        FileModule,
        MediaModule,
        TorrentClientModule
    ],
    controllers: [MediaSourceController],
    providers: [MediaSourceService]
})
export class MediaSourceModule {}
