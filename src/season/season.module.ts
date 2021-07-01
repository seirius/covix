import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MediaModule } from "src/media/media.module";
import { SeasonController } from "./season.controller";
import { Season, SeasonSchema } from "./season.schema";
import { SeasonService } from "./season.service";

@Module({
    imports: [
        MongooseModule.forFeature([{
            name: Season.name,
            schema: SeasonSchema
        }]),
        MediaModule
    ],
    controllers: [SeasonController],
    providers: [SeasonService],
    exports: [SeasonService]
})
export class SeasonModule {}