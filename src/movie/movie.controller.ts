import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { QueryWithHelpers, Types } from "mongoose";
import { File } from "src/file/file.schema";
import { Media } from "src/media/media.schema";
import { AddMovieArgs, movieAsResponse, MovieListResponse, MovieResponse, TorrentAsMovieArgs, UpdateMovieArgs } from "./movie.data";
import { MovieGateway } from "./movie.gateway";
import { MovieDocument } from "./movie.schema";
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
    public async getMovie(
        @Query("id") id?: string, 
        @Query("mediaId") mediaId?: string
    ): Promise<MovieResponse> {
        let query: QueryWithHelpers<MovieDocument, MovieDocument, {}>;
        if (id) {
            query = this.movieService.movieModel
            .findById(id);
        } else if (mediaId) {
            query = this.movieService.movieModel
            .findOne({
                media: Types.ObjectId(mediaId) as any
            });
        }
        const movie = await query
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
    public async getMovies(
        @Query("query") query: string,
        @Query("currentPage", ParseIntPipe) currentPage?: number,
        @Query("perPage", ParseIntPipe) perPage?: number
    ): Promise<MovieListResponse> {
        const where: { label?: any; } = {};
        if (query?.trim()) {
            where.label = {
                $regex: query,
                $options: "i"
            };
        }
        const pagination: {
            skip?: number;
            limit?: number;
        } = {};
        if (currentPage && perPage) {
            pagination.skip = (currentPage - 1) * perPage;
            pagination.limit = perPage;
        }
        const movies = await this.movieService.movieModel
        .find(where, null, pagination)
        .populate({
            path: "media",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        })
        .populate("icon", null, File.name)
        .collation({ locale: "en" })
        .sort({ label: 1 });
        return {
            movies: movies.map(movieAsResponse),
            totalCount: await this.movieService.movieModel.countDocuments(where)
        };
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