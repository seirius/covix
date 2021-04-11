import { Injectable } from "@nestjs/common";
import axios from "axios";
import { MovieTf, MovieTfArgs, MovieTfResponse, TfSource } from "./torrent-feed.data";

const SOURCES: {
    [key: string]: {
        endpoint: string;
        movies: (args: MovieTfArgs) => Promise<MovieTfResponse>;
    };
} = {
    [TfSource.YTS]: {
        endpoint: "https://yts.mx/api/v2/list_movies.json",
        movies: async function (args: MovieTfArgs): Promise<MovieTfResponse> {
            const response = await axios.get(this.endpoint, {
                params: {
                    limit: args.limit,
                    page: args.page,
                    query_term: args.query
                }
            });
            const {
                data: {
                    data: {
                        movie_count,
                        movies
                    }
                }
            } = response;
            return {
                totalCount: movie_count,
                movies: movies?.map((movie: any) => ({
                    label: movie.title,
                    icon: movie.medium_cover_image,
                    feeds: movie.torrents.map((torrent: any) => ({
                        url: torrent.url,
                        quality: torrent.quality,
                        size: torrent.size
                    }))
                }))
            };
        }
    }
};

@Injectable()
export class TorrentFeedService {

    public async getMovies(args: MovieTfArgs): Promise<MovieTfResponse> {
        const sourceConsts = args.sources.map(source => SOURCES[source]);
        const limit = args.limit / sourceConsts.length;
        const response = await Promise.all(sourceConsts.map(source => source.movies({ ...args, limit })));
        const totalCount = response.map(r => r.totalCount).reduce((a, b) => a + b, 0);
        const movies: MovieTf[] = [];
        response.filter(r => r.movies?.length).forEach(r => movies.push(...r.movies));
        return {
            totalCount,
            movies
        };
    }

}