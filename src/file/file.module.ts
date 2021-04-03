import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FileController } from "./file.controller";
import { File, FileSchema } from "./file.schema";
import { FileService } from "./file.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: File.name,
                schema: FileSchema
            }
        ])
    ],
    providers: [
        FileService
    ],
    exports: [FileService],
    controllers: [FileController]
})
export class FileModule {}
