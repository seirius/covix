import { Body, Controller, Get, HttpStatus, Param, Post, Query, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import * as fs from "fs";
import { join, extname } from "path";
import { CovixConfig } from "./config/CovixConfig";
import { RoomDto, RoomResponse } from "./room/room.dto";
import { RoomService } from "./room/room.service";
import { diskStorage } from "multer";
import { v4 as uuid } from "uuid";


@Controller("/api")
export class AppController {
    constructor(
        private roomService: RoomService
    ) {
    }

    @Get("socket-path")
    public getSocketPath(): { socketPath: string } {
        return { socketPath: CovixConfig.SOCKET_PATH };
    }

    @Get("video")
    public async getVideo(
        @Req()
        request: Request,
        @Res()
        response: Response,
        @Query("filename")
        filename: string
    ) {
        const path = join(CovixConfig.FILE_PATH, filename);
        const stat = await fs.promises.stat(path);
        const fileSize = stat.size;
        const { range } = request.headers;
        const ext = extname(filename);
        const contentType = `video/${ext}`;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const parts1 = parts[1];
            const end = parts1 ? parseInt(parts1, 10) : fileSize - 1;
            const chunkSize = end - start + 1;
            const file = fs.createReadStream(path, { start, end });
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
            fs.createReadStream(path).pipe(response);
        }
    }

    @Post("new-room")
    @UseInterceptors(FileInterceptor("videoFile", {
        storage: diskStorage({
            destination: CovixConfig.FILE_PATH,
            filename: (req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`)
        })
    }))
    public newRoom(
        @UploadedFile() videoFile: Express.Multer.File
    ): Promise<RoomResponse> {
        return this.roomService.newRoom(videoFile);
    }

    @Post("room/:id/track")
    @UseInterceptors(FileInterceptor("subtitleFile"))
    public async addTrack(
        @UploadedFile() subtitleFile: Express.Multer.File,
        @Body() body: { language: string; },
        @Param("id") roomId: string
    ): Promise<void> {
        await this.roomService.addTrack(roomId, subtitleFile, body.language);
    }

    @Get("room/:id/users")
    public async getUsers(
        @Param("id")
        roomId: string
    ): Promise<string[]> {
        return (await this.roomService.getUsers(roomId))
            .map((({ username }) => username));
    }

    @Get("room/:id/tracks")
    public getTracks(
        @Param("id")
        roomId: string
    ): Promise<string[]> {
        return this.roomService.getTracks(roomId);
    }

    @Get("room/:id/track/:lang")
    public getTrack(
        @Param("id")
        roomId: string,
        @Param("lang")
        lang: string,
        @Res()
        response: Response
    ): void {
        response.sendFile(join(CovixConfig.FILE_PATH, `${roomId}_${lang}.vtt`));
    }

    @Get("room/:id")
    public getRoom(
        @Param("id")
        roomId: string
    ): Promise<RoomDto> {
        return this.roomService.getRoom(roomId);
    }

}
