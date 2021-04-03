import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MediaModule } from "src/media/media.module";
import { MovieController } from "./movie.controller";
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
        MediaModule
    ],
    controllers: [MovieController],
    providers: [MovieService],
    exports: [MovieService]
})
export class MovieModule {}