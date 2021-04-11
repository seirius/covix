import { fileAsResponse, FileResponse } from "src/file/file.data";
import { Media } from "./media.schema";

export interface MediaResponse {
    id: string;
    file: FileResponse;
    tracks: FileResponse[];
}

export function mediaAsResponse(media: Media): MediaResponse {
    return {
        id: media._id,
        file: fileAsResponse(media.file),
        tracks: media.tracks?.map(fileAsResponse)
    };
}