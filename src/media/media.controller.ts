import { Body, Controller, Get, HttpStatus, NotFoundException, Param, Put, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { fileAsResponse, FileResponse } from "src/file/file.data";
import { File } from "src/file/file.schema";
import { getFilePath } from "src/file/file.service";
import { MediaService } from "./media.service";

export interface MediaResponse {
    file: FileResponse;
    tracks: FileResponse[];
}

@Controller("api/media")
export class MediaController {

    constructor(
        private readonly mediaService: MediaService
    ) {}

    @Get(":filename/video")
    public async getVideo(
        @Req()
        request: Request,
        @Res()
        response: Response,
        @Param("filename")
        filename: string
    ) {
        const filePath = getFilePath(filename);
        const stat = await fs.promises.stat(filePath);
        const fileSize = stat.size;
        const { range } = request.headers;
        const ext = path.extname(filename);
        const contentType = `video/${ext}`;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const parts1 = parts[1];
            const end = parts1 ? parseInt(parts1, 10) : fileSize - 1;
            const chunkSize = end - start + 1;
            const file = fs.createReadStream(filePath, { start, end });
            response.writeHead(HttpStatus.PARTIAL_CONTENT, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                "Content-Type": contentType,
            });
            file.pipe(response);
        } else {
            response.writeHead(HttpStatus.OK, {
                "Content-Length": fileSize,
                "Content-Type": contentType,
            });
            fs.createReadStream(filePath).pipe(response);
        }
    }

    @Get(":trackname/track")
    public getTrack(
        @Param("trackname")
        trackname: string,
        @Res()
        response: Response
    ): void {
        const filePath = getFilePath(trackname);
        response.sendFile(filePath);
    }

    @Get(":id")
    public async getMedia(@Param("id") mediaId: string): Promise<MediaResponse> {
        const media = await this.mediaService.mediaModel.findById(mediaId)
        .populate("tracks", null, File.name)
        .populate("file", null, File.name);
        if (!media) {
            throw new NotFoundException("Media not found");
        }
        return {
            file: fileAsResponse(media.file),
            tracks: media.tracks?.map(fileAsResponse)
        };
    }

    @Put(":id/track")
    public async addTrack(
        @Param("id") mediaId,
        @Body() body: { trackName: string }
    ): Promise<void> {
        await this.mediaService.addTrack(mediaId, body.trackName);
    }

}