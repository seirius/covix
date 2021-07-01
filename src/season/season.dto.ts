import { mediaAsResponse, MediaResponse } from "src/media/media.data";
import { Season } from "./season.schema";

export interface SeasonResponse {
    id: string;
    label: string;
    tvShowId: string;
    index: number;
    medias?: MediaResponse[];
}

export function seasonAsResponse(season: Season): SeasonResponse {
    return {
        id: season._id,
        label: season.label,
        tvShowId: season.tvShow?._id,
        index: season.index,
        medias: season.medias ? season.medias.map(mediaAsResponse) : null
    };
}

export interface AddEpisodeArgs {
    seasonId: string;
    filename: string;
    index?: number;
}

export interface RemoveEpisodeArgs {
    seasonId: string;
    mediaId: string;
}

export interface UpdateSeasonIndexArgs {
    seasonId: string;
    index: number;
}