import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { File } from "src/file/file.schema";
import { Media } from "src/media/media.schema";
import { AddMovieArgs, movieAsResponse, MovieResponse, TorrentAsMovieArgs, UpdateMovieArgs } from "./movie.data";
import { MovieGateway } from "./movie.gateway";
import { MovieService } from "./movie.service";

@Controller("api/movie")
export class MovieController {

    constructor(
        private readonly movieService: MovieService,
        private readonly movieGateway: MovieGateway
    ) {}

    @Post("")
    public async saveMovie(
        @Body() body: AddMovieArgs
    ): Promise<MovieResponse> {
        const movie = await this.movieService.addMovie(body);
        return movieAsResponse(movie);
    }

    @Put("")
    public async updateMovie(
        @Query("id") id: string,
        @Body() body: UpdateMovieArgs
    ): Promise<MovieResponse> {
        const movie = await this.movieService.updateMovie(id, body);
        return movieAsResponse(movie);
    }

    @Post("torrent")
    public async saveMovieFromTorrent(
        @Body() body: TorrentAsMovieArgs
    ): Promise<MovieResponse> {
        const movie = await this.movieService.addMovieFromTorrent(body);
        return movieAsResponse(movie);
    }

    @Get("")
    public async getMovie(@Query("id") id: string): Promise<MovieResponse> {
        const movie = await this.movieService.movieModel
        .findById(id)
        .populate({
            path: "media",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        })
        .populate("icon", null, File.name);
        if (!movie) {
            throw new NotFoundException("Movie not found");
        }
        return movieAsResponse(movie);
    }

    @Get("list")
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
        .populate("icon", null, File.name)
        .sort({ label: "asc" })
        return movies.map(movieAsResponse);
    }

    @Delete(":id")
    public async deleteMovie(@Param("id") id: string): Promise<void> {
        const movie = await this.movieService.movieModel.findById(id);
        if (!movie) {
            throw new NotFoundException("Movie not found");
        }
        await this.movieService.removeMovie(id);
        this.movieGateway.movieDeleted(id);
    }



}