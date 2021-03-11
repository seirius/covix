import { Body, Controller, Get, HttpStatus, Param, Post, Query, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import * as fs from "fs";
import { join } from "path";
import { CovixConfig } from "./config/CovixConfig";
import { RoomResponse } from "./room/room.dto";
import { RoomService } from "./room/room.service";


@Controller("/api")
export class AppController {
    constructor(
        private roomService: RoomService
    ) { }

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
        @Query("id")
        id: string
    ) {
        const path = join(CovixConfig.FILE_PATH, `${id}.mp4`);
        const stat = await fs.promises.stat(path);
        const fileSize = stat.size;
        const { range } = request.headers;
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
                "Content-Type": "video/mp4",
            });
            file.pipe(response);
        } else {
            response.writeHead(HttpStatus.OK, {
                "Content-Length": fileSize,
                "Content-Type": "video/mp4",
            });
            fs.createReadStream(path).pipe(response);
        }
    }

    @Post("new-room")
    @UseInterceptors(FileInterceptor("videoFile"))
    public newRoom(
        @UploadedFile() videoFile: Express.Multer.File
    ): Promise<RoomResponse> {
        return this.roomService.newRoom(videoFile);
    }

    @Get("room/:id/users")
    public async getUsers(
        @Param("id")
        roomId: string
    ): Promise<string[]> {
        return (await this.roomService.getUsers(roomId))
            .map((({ username }) => username));
    }

}
