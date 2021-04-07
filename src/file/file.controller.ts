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
    public uploadFile(
        @UploadedFile() file: Express.Multer.File
    ): Promise<FileResponse> {
        return this.fileService.saveFile(file.filename, file.originalname);
    }

}