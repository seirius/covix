import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as fs from "fs";
import * as path from "path";
import { FileDocument, File } from "./file.schema";
import { CovixConfig } from "src/config/CovixConfig";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuid } from "uuid";
import * as srt2Vtt from "srt-to-vtt";

async function exists(path: string): Promise<boolean> {
    try {
        await fs.promises.access(path);
        return true;
    } catch (error) {
        return false;
    }
}

export function getFilePath(name: string): string {
    return path.join(CovixConfig.FILE_PATH, name);
}

export async function getTorrentTmpPath(): Promise<string> {
    const torrentTmpPath = path.join(CovixConfig.FILE_PATH, "tmp");
    const dirExists = await exists(torrentTmpPath);
    if (!dirExists) {
        await fs.promises.mkdir(torrentTmpPath);
    }
    return torrentTmpPath;
}

export const FileStorage = FileInterceptor("file", {
    storage: diskStorage({
        destination: CovixConfig.FILE_PATH,
        filename: (req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`)
    })
});

interface FileData {
    name: string;
    originalName: string;
}

export const FILE_TO_PARSE = {
    SUBTITLES: {
        ORIGIN: ".srt",
        TARGET: ".vtt",
        PARSE: function (name: string, originalName: string): Promise<FileData> {
            return new Promise<FileData>((resolve, reject) => {
                const parsedPath = path.parse(name);
                const vttName = parsedPath.name + this.TARGET;
                const originalNameVtt = path.parse(originalName).name + this.TARGET;
                const srtPath = getFilePath(name);
                const vttPath = getFilePath(vttName);
                const writable = fs.createWriteStream(vttPath);
                fs
                .createReadStream(srtPath)
                .pipe(srt2Vtt())
                .pipe(writable);
                writable.on("finish", async () => {
                    await fs.promises.unlink(srtPath);
                    resolve({
                        name: vttName,
                        originalName: originalNameVtt
                    });
                })
            });
        }
    }
};

@Injectable()
export class FileService {

    constructor(
        @InjectModel(File.name)
        public readonly fileModel: Model<FileDocument>,
    ) {}

    public async parseIfNeeded(name: string, originalName: string): Promise<FileData> {
        const { ext } = path.parse(name);
        await Promise.all(Object
        .values(FILE_TO_PARSE)
        .map(async parser => {
            if (parser.ORIGIN === ext) {
                const result = await parser.PARSE(name, originalName);
                name = result.name;
                originalName = result.originalName;
            }
        }));
        return {
            name, originalName
        };
    }

    public async saveFile(name: string, originalName: string): Promise<FileDocument> {
        const { name: parsedName, originalName: parsedOName } = await this.parseIfNeeded(name, originalName);
        const file = new this.fileModel({
            name: parsedName,
            originalName: parsedOName
        });
        await file.save();
        return file;
    }

    public async deleteFile(name: string): Promise<void> {
        const file = await this.fileModel.findOne({ name });
        if (file) {
            await this.fileModel.deleteOne({ name });
        }
        const filePath = getFilePath(name);
        if (await exists(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }


}