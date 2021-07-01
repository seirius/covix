import { Body, Controller, Delete, Get, NotFoundException, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { Types } from "mongoose";
import { File } from "src/file/file.schema";
import { mediaAsResponse, MediaResponse } from "src/media/media.data";
import { Media } from "src/media/media.schema";
import { AddEpisodeArgs, seasonAsResponse, SeasonResponse, UpdateSeasonIndexArgs } from "src/season/season.dto";
import { SeasonService } from "src/season/season.service";
import { AddShowTrackerArgs, showTrackerAsResponse, ShowTrackerResponse } from "src/show-tracker/show-tracker.dto";
import { CreateEmptySeasonArgs, CreateShowArgs, tvShowAsResponse, TvShowListResponse, TvShowResponse, UpdateEpisodeIndex, UpdateTvShowArgs } from "./tv-show.dto";
import { TvShowGateway } from "./tv-show.gateway";
import { TvShowService } from "./tv-show.service";

@Controller("api/tv-show")
export class TvShowController {

    constructor(
        private readonly tvShowService: TvShowService,
        private readonly seasonService: SeasonService,
        private readonly tvShowGateway: TvShowGateway,
    ) {}

    @Post()
    public async createTvShow(@Body() args: CreateShowArgs): Promise<TvShowResponse> {
        const tvShow = await this.tvShowService.createTvShow(args);
        return tvShowAsResponse(tvShow);
    }

    @Delete()
    public async deleteTvShow(@Query("id") id: string): Promise<void> {
        await this.tvShowService.deleteTvShow(id);
        this.tvShowGateway.tvShowDeleted(id);
    }

    @Post("season")
    public async createSeason(@Body() args: CreateEmptySeasonArgs): Promise<SeasonResponse> {
        const season = await this.tvShowService.createEmptySeason(args);
        return seasonAsResponse(season);
    }

    @Delete("season")
    public async deleteSeason(@Query("seasonId") seasonId: string): Promise<TvShowResponse> {
        const deletedSeason = await this.seasonService.deleteSeason(seasonId);
        const [tvShow, seasons] = await Promise.all([
            this.tvShowService.tvShowModel.findById(deletedSeason.tvShow._id),
            this.tvShowService.seasons(deletedSeason.tvShow._id)
        ]);
        return tvShowAsResponse(tvShow, seasons);
    }

    @Put("season/index")
    public async updateSeasonIndex(@Body() args: UpdateSeasonIndexArgs): Promise<SeasonResponse> {
        const season = await this.seasonService.updateSeasonIndex(args);
        return seasonAsResponse(season);
    }

    @Post("season/episode")
    public async addEpisode(@Body() args: AddEpisodeArgs): Promise<SeasonResponse> {
        await this.seasonService.addEpisode(args);
        const season = await this.seasonService.seasonModel
        .findById(args.seasonId)
        .populate({
            path: "medias",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        });
        return seasonAsResponse(season);
    }

    @Delete("season/episode")
    public async deleteEpisode(@Query("seasonId") seasonId: string, @Query("mediaId") mediaId: string): Promise<SeasonResponse> {
        const season = await this.seasonService.removeEpisode({ seasonId, mediaId });
        return seasonAsResponse(season);
    }

    @Get("season/episode")
    public async getEpisode(@Query("tvShowId") tvShowId: string, @Query("userId") userId: string): Promise<MediaResponse> {
        const media = await this.tvShowService.getEpisode(tvShowId, userId);
        return mediaAsResponse(media);
    }

    @Put("season/episode/index")
    public async updateEpisodeIndex(@Body() args: UpdateEpisodeIndex): Promise<SeasonResponse> {
        const season = await this.tvShowService.updateEpisodeIndex(args);
        return seasonAsResponse(season);
    }

    @Post("show-tracker")
    public async addShowTracker(@Body() showTrackerArgs: AddShowTrackerArgs): Promise<ShowTrackerResponse> {
        const showTracker = await this.tvShowService.addShowTracker(showTrackerArgs);
        return showTrackerAsResponse(showTracker);
    }

    @Get("list")
    public async getTvShows(
        @Query("query") query: string,
        @Query("currentPage", ParseIntPipe) currentPage?: number,
        @Query("perPage", ParseIntPipe) perPage?: number
    ): Promise<TvShowListResponse> {
        const where: { label?: any; } = {};
        if (query?.trim()) {
            where.label = {
                $regex: query,
                $options: "i"
            };
        }
        const pagination: {
            skip?: number;
            limit?: number;
        } = {};
        if (currentPage && perPage) {
            pagination.skip = (currentPage - 1) * perPage;
            pagination.limit = perPage;
        }
        const tvShows = await this.tvShowService.tvShowModel
        .find(where, null, pagination)
        .populate("icon", null, File.name)
        .collation({ locale: "en" })
        .sort({ label: 1 });
        return {
            tvShows: tvShows.map(tvShow => tvShowAsResponse(tvShow)),
            totalCount: await this.tvShowService.tvShowModel.countDocuments(where)
        };
    }

    @Put()
    public async updateTvShow(
        @Query("id") id: string,
        @Body() args: UpdateTvShowArgs
    ): Promise<TvShowResponse> {
        const tvShow = await this.tvShowService.updateTvShow(id, args);
        return tvShowAsResponse(tvShow);
    }

    @Get()
    public async getTvShow(@Query("id") id: string): Promise<TvShowResponse> {
        const tvShow = await this.tvShowService.tvShowModel.findById(id);
        if (!tvShow) {
            throw new NotFoundException(`Tv show not found by ${id}`);
        }
        return tvShowAsResponse(tvShow);
    }

    @Get("seasons")
    public async getSeasons(@Query("id") id: string): Promise<SeasonResponse[]> {
        const seasons = await this.seasonService.seasonModel.find({
            tvShow: Types.ObjectId(id) as any
        }).populate({
            path: "medias",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        })
        .sort({ index: 1 });
        return seasons.map(seasonAsResponse);
    }

    // @Get("/test")
    // public async getTest(): Promise<any> {
    //     return this.showTrackerService.showTrackerModel.find(<any>{
    //         $where: `user.id == ${Types.ObjectId("60776c1082d21c6e830dd9c1")}`
    //     });
    // }

}