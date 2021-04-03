import { Body, Controller, Get, Post } from "@nestjs/common";
import { File } from "src/file/file.schema";
import { Media } from "src/media/media.schema";
import { movieAsResponse, MovieResponse } from "./movie.data";
import { MovieService } from "./movie.service";

@Controller("api/movie")
export class MovieController {

    constructor(
        private readonly movieService: MovieService
    ) {}

    @Post("")
    public async saveMovie(
        @Body() body: { label: string, name: string }
    ): Promise<MovieResponse> {
        const movie = await this.movieService.addMovie(body.label, body.name);
        return movieAsResponse(movie);
    }

    @Get("")
    public async getMovies(): Promise<MovieResponse[]> {
        const movies = await this.movieService.movieModel
        .find()
        .populate({
            path: "media",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        })
        .sort({ label: "asc" })
        return movies.map(movieAsResponse);
    }



}