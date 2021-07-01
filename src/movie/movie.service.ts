import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { File } from "src/file/file.schema";
import { FileService } from "src/file/file.service";
import { Media } from "src/media/media.schema";
import { MediaService } from "src/media/media.service";
import { TorrentClientService } from "src/torrent-client/torrent-client.service";
import { AddMovieArgs, TorrentAsMovieArgs, UpdateMovieArgs } from "./movie.data";
import { Movie, MovieDocument } from "./movie.schema";

@Injectable()
export class MovieService {

    constructor(
        @InjectModel(Movie.name)
        public readonly movieModel: Model<MovieDocument>,
        private readonly mediaService: MediaService,
        private readonly torrentService: TorrentClientService,
        private readonly fileService: FileService
    ) {}

    public async addMovie({
        name, label, iconUrl, icon
    }: AddMovieArgs): Promise<MovieDocument> {
        const media = await this.mediaService.createMedia(name);
        let iconFile: File;
        if (icon) {
            iconFile = await this.fileService.fileModel.findOne({ name: icon });
        }
        const movie = new this.movieModel({
            label, media, iconUrl, icon: iconFile
        });
        return movie.save();
    }

    public async updateMovie(id: string, {
        label, name, iconUrl, icon, feed
    }: UpdateMovieArgs): Promise<MovieDocument> {
        const movie = await this.movieModel.findById(id)
        .populate("media", null, Media.name)
        .populate("icon", null, File.name);
        if (!movie) {
            throw new NotFoundException("Movie not found");
        }
        if (label) {
            movie.label = label;
        }
        if (name || feed) {
            if (movie.media) {
                await this.mediaService.deleteMedia(movie.media._id);
            }
            if (feed) {
                const { file } = await this.torrentService.addTorrent(feed);
                name = file.name;
            }
            movie.media = await this.mediaService.createMedia(name);
        }
        if (icon || iconUrl) {
            if (movie.icon) {
                await this.fileService.deleteFile(movie.icon.name);
            }
            if (icon) {
                movie.icon = await this.fileService.fileModel.findOne({ name: icon });
                movie.iconUrl = null;
            }
            if (iconUrl) {
                movie.iconUrl = iconUrl;
            }
        }
        return movie.save();
    }

    public async addMovieFromTorrent({
        feed, label, iconUrl, icon
    }: TorrentAsMovieArgs): Promise<MovieDocument> {
        let movie = await this.movieModel.findOne({ label });
        if (movie) {
            throw new ConflictException("Movie already exists");
        }
        const { file } = await this.torrentService.addTorrent(feed);
        const media = await this.mediaService.createMedia(file.name);
        let iconFile: File;
        if (icon) {
            iconFile = await this.fileService.fileModel.findOne({ name: icon });
        }
        movie = new this.movieModel({
            label, media, iconUrl, icon: iconFile
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
        .populate("media", null, Media.name)
        .populate("icon", null, File.name);
        if (movie) {
            if (movie.media) {
                await this.mediaService.deleteMedia(movie.media._id);
            }
            if (movie.icon) {
                await this.fileService.deleteFile(movie.icon.name);
            }
            await movie.remove();
        }
    }

}