import { File } from "./file.schema";

export function fileAsResponse(file: File): FileResponse {
    return {
        name: file.name,
        originalName: file.originalName
    };
}

export interface FileResponse {
    name: string;
    originalName: string;
}