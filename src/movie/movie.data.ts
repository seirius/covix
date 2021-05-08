import { Movie } from "./movie.schema";

export function movieAsResponse(movie: Movie): MovieResponse {
    return {
        id: (<any>movie).id,
        mediaId: (<any>movie?.media)?.id,
        filename: movie?.media?.file?.name,
        label: movie.label,
        iconUrl: movie.iconUrl,
        icon: movie.icon?.name
    };
}

export interface AddMovieArgs {
    label: string;
    name?: string;
    feed?: string;
    iconUrl?: string;
    icon?: string;
}

export interface UpdateMovieArgs {
    label?: string;
    name?: string;
    iconUrl?: string;
    icon?: string;
    feed?: string;
}

export interface TorrentAsMovieArgs {
    feed: string;
    label: string;
    iconUrl: string;
    icon?: string;
}

export class MovieResponse {
    id: string;
    mediaId: string;
    filename: string;
    label: string;
    iconUrl?: string;
    icon?: string;
}

export interface MovieListResponse {
    movies: MovieResponse[];
    totalCount: number;
}