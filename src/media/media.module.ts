import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FileModule } from "src/file/file.module";
import { MediaController } from "./media.controller";
import { Media, MediaSchema } from "./media.schema";
import { MediaService } from "./media.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Media.name,
                schema: MediaSchema
            }
        ]),
        FileModule
    ],
    providers: [MediaService],
    exports: [MediaService],
    controllers: [MediaController]
})
export class MediaModule {}