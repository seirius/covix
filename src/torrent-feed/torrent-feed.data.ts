export interface MovieTfArgs {
    query: string;
    page: number;
    limit: number;
    sources: TfSource[];
}

export interface Feed {
    url: string;
    quality: string;
    size: string;
}

export interface MovieTf {
    label: string;
    icon: string;
    feeds: Feed[];
}

export enum TfSource {
    YTS = "yts"
}

export interface MovieTfResponse {
    movies: MovieTf[];
    totalCount: number;
}