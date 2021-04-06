import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Media } from "src/media/media.schema";
import { MovieService } from "src/movie/movie.service";
import { User } from "src/user/user.schema";
import { RoomResponse, RoomDto, roomAsResponse, RoomWithMediaResponse } from "./room.dto";
import { RoomService } from "./room.service";

@Controller("api/room")
export class RoomController {

    constructor(
        private readonly roomService: RoomService,
        private readonly movieService: MovieService
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
            const movie = await this.movieService.movieModel.findOne({ media: <any>room.media._id })
            .populate("media", null, Media.name);
            response.push({
                ...roomAsResponse(room),
                mediaLabel: movie.label
            });
        }));
        return response;
    }

}