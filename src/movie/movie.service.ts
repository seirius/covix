import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Media } from "src/media/media.schema";
import { MediaService } from "src/media/media.service";
import { Movie, MovieDocument } from "./movie.schema";

@Injectable()
export class MovieService {

    constructor(
        @InjectModel(Movie.name)
        public readonly movieModel: Model<MovieDocument>,
        private readonly mediaService: MediaService
    ) {}

    public async addMovie(label: string, fileName: string): Promise<MovieDocument> {
        const media = await this.mediaService.createMedia(fileName);
        const movie = new this.movieModel({
            label, media
        });
        await movie.save();
        return movie;
    }

    public async addTrack(id: string, trackName: string): Promise<void> {
        const movie = await this.movieModel.findById(id)
        .populate("media", null, Media.name);
        if (!movie) {
            throw new NotFoundException(`Movie not found (id:${id})`);
        }
        await this.mediaService.addTrack(movie.media.asDocument().id, trackName);
    }

    public async removeMovie(id: string): Promise<void> {
        const movie = await this.movieModel.findById(id)
        .populate("media", null, Media.name);
        if (movie) {
            await this.mediaService.deleteMedia(movie.media.asDocument().id);
            await movie.remove();
        }
    }

}