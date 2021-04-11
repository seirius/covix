import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CovixConfig } from './config/CovixConfig';
import { MediaSourceModule } from './media-source/media-source.module';
import { MovieModule } from './movie/movie.module';
import { RoomModule } from './room/room.module';
import { TorrentClientModule } from './torrent-client/torrent-client.module';
import { TorrentFeedModule } from './torrent-feed/torrent-feed.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "covix-web"),
            exclude: ["/api*"]
        }),
        MongooseModule.forRoot(CovixConfig.MONGO_URL),
        RoomModule,
        MovieModule,
        TorrentFeedModule,
        TorrentClientModule,
        MediaSourceModule
    ],
    controllers: [AppController],
    providers: [
        AppService
    ],
})
export class AppModule { }
