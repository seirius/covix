import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FileModule } from "src/file/file.module";
import { MediaModule } from "src/media/media.module";
import { MovieController } from "./movie.controller";
import { MovieGateway } from "./movie.gateway";
import { Movie, MovieSchema } from "./movie.schema";
import { MovieService } from "./movie.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Movie.name,
                schema: MovieSchema
            }
        ]),
        MediaModule,
        FileModule
    ],
    controllers: [MovieController],
    providers: [MovieService, MovieGateway],
    exports: [MovieService]
})
export class MovieModule {}