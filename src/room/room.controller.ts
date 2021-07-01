import { Body, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { Types } from "mongoose";
import { File } from "src/file/file.schema";
import { mediaAsResponse } from "src/media/media.data";
import { Media } from "src/media/media.schema";
import { movieAsResponse, MovieResponse } from "src/movie/movie.data";
import { MovieService } from "src/movie/movie.service";
import { seasonAsResponse } from "src/season/season.dto";
import { SeasonService } from "src/season/season.service";
import { tvShowAsResponse, TvShowResponse } from "src/tv-show/tv-show.dto";
import { TvShowService } from "src/tv-show/tv-show.service";
import { User } from "src/user/user.schema";
import { roomAsResponse, RoomDto, RoomResponse, roomWithMediaAsResponse, RoomWithMediaResponse, TvShowForRoom } from "./room.dto";
import { RoomService } from "./room.service";

@Controller("api/room")
export class RoomController {

    constructor(
        private readonly roomService: RoomService,
        private readonly movieService: MovieService,
        private readonly tvShowService: TvShowService,
        private readonly seasonService: SeasonService
    ) {}

    @Get("")
    public getRoom(
        @Query("id")
        roomId: string
    ): Promise<RoomDto> {
        return this.roomService.getRoom(roomId);
    }

    @Post("")
    public newRoom(
        @Body() body: { mediaId: string; username: string }
    ): Promise<RoomResponse> {
        return this.roomService.newRoom(body.mediaId, body.username);
    }

    @Get(":id/users")
    public async getUsers(
        @Param("id")
        roomId: string
    ): Promise<string[]> {
        return (await this.roomService.getUsers(roomId))
            .map((({ username }) => username));
    }

    @Get("live")
    public async getLiveRooms(): Promise<RoomResponse[]> {
        const rooms = await this.roomService.roomModel.find({
            "users.0": {
                "$exists": true
            }
        })
        .populate("users", null, User.name)
        .populate("media", null, Media.name)
        .populate("owner", null, User.name);
        const response: RoomWithMediaResponse[] = [];
        await Promise.all(rooms.map(async room => {
            const movie = await this.movieService.movieModel.findOne({ media: <any> Types.ObjectId(room.media._id) });
            response.push(roomWithMediaAsResponse(room, movie.label));
        }));
        return response;
    }

    @Get("movie")
    public async getMovieInRoom(@Query("id") id): Promise<MovieResponse> {
        const room = await this.roomService.roomModel.findOne({ roomId: id });
        if (!room) {
            throw new NotFoundException("Room not found");
        }
        const movie = await this.movieService.movieModel.findOne({
            media: room.media
        });
        if (!movie) {
            throw new NotFoundException("Movie not found");
        }
        return movieAsResponse(movie);
    }

    @Get("tv-show")
    public async getTvShowInRoom(@Query("id") id): Promise<TvShowForRoom> {
        const room = await this.roomService.roomModel.findOne({ roomId: id })
        .populate({
            path: "media",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        })
        .populate("owner", null, User.name);
        if (!room) {
            throw new NotFoundException("Room not found");
        }
        const season = await this.seasonService.seasonModel.findOne({
            medias: {
                $in: [room.media]
            }
        });
        if (!season) {
            throw new NotFoundException("Season not found");
        }
        const tvShow = await this.tvShowService.tvShowModel
        .findById(season.tvShow._id);
        if (!tvShow) {
            throw new NotFoundException("Tv show not found");
        }
        const seasons = await this.seasonService.seasonModel.find({
            tvShow: <any> Types.ObjectId(tvShow._id)
        }).populate({
            path: "medias",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        })
        .sort({ index: 1 });
        return {
            tvShow: tvShowAsResponse(tvShow, seasons),
            season: seasonAsResponse(season),
            media: mediaAsResponse(room.media),
            room: roomAsResponse(room)
        };
    }

}