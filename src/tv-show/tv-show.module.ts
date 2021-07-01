import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FileModule } from "src/file/file.module";
import { MediaModule } from "src/media/media.module";
import { SeasonModule } from "src/season/season.module";
import { ShowTrackerModule } from "src/show-tracker/show-tracker.module";
import { UserModule } from "src/user/user.module";
import { TvShowController } from "./tv-show.controller";
import { TvShowGateway } from "./tv-show.gateway";
import { TvShow, TvShowSchema } from "./tv-show.schema";
import { TvShowService } from "./tv-show.service";

@Module({
    imports: [
        MongooseModule.forFeature([{
            name: TvShow.name,
            schema: TvShowSchema
        }]),
        SeasonModule,
        TvShowModule,
        UserModule,
        MediaModule,
        ShowTrackerModule,
        FileModule
    ],
    providers: [TvShowService, TvShowGateway],
    exports: [TvShowService],
    controllers: [TvShowController]
})
export class TvShowModule {}
