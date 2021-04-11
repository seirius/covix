import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FileModule } from "src/file/file.module";
import { TorrentClientController } from "./torrent-client.controller";
import { TorrentClientGateway } from "./torrent-client.gateway";
import { TorrentClientService } from "./torrent-client.service";
import { Torrent, TorrentSchema } from "./torrent.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Torrent.name,
                schema: TorrentSchema
            }
        ]),
        FileModule
    ],
    providers: [TorrentClientService, TorrentClientGateway],
    controllers: [TorrentClientController],
    exports: [TorrentClientService, TorrentClientGateway]
})
export class TorrentClientModule {}
