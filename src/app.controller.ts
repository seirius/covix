import { Body, Controller, Get, HttpStatus, Query, Post, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import * as fs from "fs";
import { Model } from "mongoose";
import { join } from "path";
import { v4 as uuid } from "uuid";
import { CovixConfig } from "./config/CovixConfig";
import { SalaDto as RoomDto } from "./sala/room.dto";
import { Room, RoomDocument } from "./sala/room.schema";


@Controller("/api")
export class AppController {
    constructor(
        @InjectModel(Room.name)
        private readonly roomModel: Model<RoomDocument>
    ) { }

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
    public async newRoom(
        @Body() roomDto: RoomDto,
        @UploadedFile() file: Express.Multer.File
    ): Promise<any> {
        const id = uuid();
        const sala = new this.roomModel({
            id,
            users: [roomDto.username]
        });
        await sala.save();
        await fs.promises.writeFile(join(CovixConfig.FILE_PATH, `${id}.mp4`), file.buffer);
        return { id };
    }

}
