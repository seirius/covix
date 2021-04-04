import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileResponse } from "./file.data";
import { FileService, FileStorage } from "./file.service";

@Controller("api/file")
export class FileController {

    constructor(
        private readonly fileService: FileService
    ) {}

    @Post("")
    @UseInterceptors(FileStorage)
    public async uploadFile(
        @UploadedFile() file: Express.Multer.File
    ): Promise<FileResponse> {
        await this.fileService.saveFile(file.filename, file.originalname);
        return { name: file.filename, originalName: file.originalname };
    }

}