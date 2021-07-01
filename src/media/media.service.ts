import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { File } from "src/file/file.schema";
import { FileService } from "src/file/file.service";
import { Media, MediaDocument } from "./media.schema";

@Injectable()
export class MediaService {

    constructor(
        @InjectModel(Media.name)
        public readonly mediaModel: Model<MediaDocument>,
        private readonly fileService: FileService
    ) {}

    public async createMedia(fileName: string): Promise<MediaDocument> {
        const file = await this.fileService.fileModel.findOne({ name: fileName });
        if (!file) {
            throw new NotFoundException(`File not found by name ${fileName}`);
        }
        const media = new this.mediaModel({ file });
        await media.save();
        return media;
    }

    public async addTrack(id: string, trackName: string): Promise<MediaDocument> {
        const media = await this.mediaModel.findById(id);
        if (!media) {
            throw new NotFoundException(`Not found media by ${id}`);
        }
        const trackFile = await this.fileService.fileModel.findOne({ name: trackName });
        if (!media.tracks) {
            media.tracks = [];
        }
        media.tracks.push(trackFile);
        await media.save();
        return media;
    }

    public async deleteMedia(id: string): Promise<void> {
        const media = await this.mediaModel
        .findById(id)
        .populate("tracks", null, File.name)
        .populate("file", null, File.name);
        if (media) {
            if (media.tracks) {
                await Promise.all(media.tracks.map(track => this.fileService.deleteFile(track.name)));
            }
            await this.fileService.deleteFile(media.file.name);
            await media.remove();
        }
    }

}