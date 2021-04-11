import { Injectable, NotFoundException } from "@nestjs/common";
import { File } from "src/file/file.schema";
import { MediaDocument } from "src/media/media.schema";
import { MediaService } from "src/media/media.service";
import { TorrentResponse } from "src/torrent-client/torrent-client.data";
import { TorrentClientService } from "src/torrent-client/torrent-client.service";
import { TorrentDocument } from "src/torrent-client/torrent.schema";

@Injectable()
export class MediaSourceService {

    constructor(
        private readonly mediaService: MediaService,
        private readonly torrentClientService: TorrentClientService
    ) { }

    public async getMediaByTorrent(id: string): Promise<MediaDocument> {
        const torrent = await this.torrentClientService.torrentModel.findById(id)
        .populate("file", null, File.name);
        if (!torrent) {
            throw new NotFoundException("Torrent not found");
        }
        const media = await this.mediaService.mediaModel.findOne({
            file: torrent.file._id as any
        })
        .populate("file", null, File.name)
        .populate("tracks", null, File.name);
        if (!media) {
            throw new NotFoundException("Media not found");
        }
        return media;
    }

    public async getTorrentByMedia(id: string): Promise<TorrentDocument> {
        const media = await this.mediaService.mediaModel.findById(id)
        .populate("file", null, File.name);
        if (!media) {
            throw new NotFoundException("Media not found");
        }
        const torrent = await this.torrentClientService.torrentModel.findOne({
            file: media.file._id as any
        });
        if (!torrent) {
            throw new NotFoundException("Torrent not found");
        }
        return torrent;
    }

}