import { Controller, Get, HttpStatus, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AppService } from "./app.service";
import * as fs from "fs";

@Controller("/api")
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get("video")
    public async getVideo(
        @Req()
        request: Request,
        @Res()
        response: Response
    ) {
        const path = "/home/andriy/Downloads/yt.mp4";
        const stat = await fs.promises.stat(path);
        const fileSize = stat.size;
        const { range } = request.headers;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            console.log(parts);
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

}
