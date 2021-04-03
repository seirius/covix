import { Movie } from "./movie.schema";

export function movieAsResponse(movie: Movie): MovieResponse {
    return {
        id: (<any>movie).id,
        mediaId: (<any>movie?.media)?.id,
        filename: movie?.media?.file?.name,
        label: movie.label
    };
}

export class MovieResponse {
    id: string;
    mediaId: string;
    filename: string;
    label: string;
}