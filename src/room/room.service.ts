import { Injectable, NotFoundException } from "@nestjs/common";
import { JoinRoomDto, RoomDto, RoomResponse } from "./room.dto";
import { v4 as uuid } from "uuid";
import { InjectModel } from "@nestjs/mongoose";
import { Room, RoomDocument } from "./room.schema";
import { Model } from "mongoose";
import * as fs from "fs";
import { CovixConfig } from "src/config/CovixConfig";
import { join } from "path";

@Injectable()
export class RoomService {

    constructor(
        @InjectModel(Room.name)
        private readonly roomModel: Model<RoomDocument>
    ) {}

    public async newRoom(roomDto: RoomDto, file: Express.Multer.File): Promise<RoomResponse> {
        const id = uuid();
        const sala = new this.roomModel({
            id,
            users: [roomDto.username]
        });
        await sala.save();
        await fs.promises.writeFile(join(CovixConfig.FILE_PATH, `${id}.mp4`), file.buffer);
        return { id, users: [roomDto.username] };
    }

    public async joinRoom({ roomId: id, username }: JoinRoomDto): Promise<RoomResponse> {
        const room = await this.roomModel.findOne({ id });
        if (!room) {
            throw new NotFoundException("Room doesn't exist");
        }
        if (!room.users.includes(username)) {
            room.users.push(username);
            await room.save();
        }
        return {
            users: room.users,
            id: room.id
        };
    }

}