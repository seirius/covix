import { seasonAsResponse, SeasonResponse } from "src/season/season.dto";
import { Season } from "src/season/season.schema";
import { TvShow } from "./tv-show.schema";

export interface TvShowResponse {
    id: string;
    label: string;
    iconUrl?: string;
    icon?: string;
    seasons?: SeasonResponse[];
}

export function tvShowAsResponse(tvShow: TvShow, seasons?: Season[]): TvShowResponse {
    return {
        id: tvShow._id,
        label: tvShow.label,
        iconUrl: tvShow.iconUrl,
        icon: tvShow.icon?.name,
        seasons: seasons?.length ? seasons.map(seasonAsResponse) : null
    };
}

export interface CreateShowArgs {
    label: string;
    iconUrl?: string;
    icon?: string;
}

export interface CreateEmptySeasonArgs {
    tvShowId: string;
    seasonLabel: string;
    index?: number;
}

export interface TvShowListResponse {
    tvShows: TvShowResponse[];
    totalCount: number;
}

export interface UpdateTvShowArgs {
    label?: string;
    iconUrl?: string;
    icon?: string;
}

export interface UpdateEpisodeIndex {
    mediaId: string;
    index: number;
}
