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

async function exists(path: string): Promise<boolean> {
    try {
        await fs.promises.access(path);
    } catch (error) {
        return false;
    }
}

export function getFilePath(name: string): string {
    return path.join(CovixConfig.FILE_PATH, name);
}

export const FileStorage = FileInterceptor("file", {
    storage: diskStorage({
        destination: CovixConfig.FILE_PATH,
        filename: (req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`)
    })
});

@Injectable()
export class FileService {

    constructor(
        @InjectModel(File.name)
        public readonly fileModel: Model<FileDocument>,
    ) {}

    public async saveFile(name: string, originalName: string): Promise<FileDocument> {
        const file = new this.fileModel({ name, originalName });
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