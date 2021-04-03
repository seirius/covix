import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RoomResponse, RoomDto } from "./room.dto";
import { RoomService } from "./room.service";

@Controller("api/room")
export class RoomController {

    constructor(
        private readonly roomService: RoomService
    ) {}

    @Get(":id")
    public getRoom(
        @Param("id")
        roomId: string
    ): Promise<RoomDto> {
        return this.roomService.getRoom(roomId);
    }

    @Post("")
    public newRoom(
        @Body() body: { mediaId: string; }
    ): Promise<RoomResponse> {
        return this.roomService.newRoom(body.mediaId);
    }

    @Get(":id/users")
    public async getUsers(
        @Param("id")
        roomId: string
    ): Promise<string[]> {
        return (await this.roomService.getUsers(roomId))
            .map((({ username }) => username));
    }

}