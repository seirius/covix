import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as fs from "fs";
import { Model } from "mongoose";
import { join } from "path";
import { CovixConfig } from "src/config/CovixConfig";
import { User, UserDocument } from "src/user/user.schema";
import { UserService } from "src/user/user.service";
import { v4 as uuid } from "uuid";
import { RoomResponse } from "./room.dto";
import { Room, RoomDocument } from "./room.schema";

const MESSAGES = {
    ROOM_NOT_FOUND: "Room doesn't exist"
}

@Injectable()
export class RoomService {

    constructor(
        @InjectModel(Room.name)
        private readonly roomModel: Model<RoomDocument>,
        private readonly userService: UserService
    ) {}

    public async newRoom(file: Express.Multer.File): Promise<RoomResponse> {
        const roomId = uuid();
        const room = new this.roomModel({
            id: roomId
        });
        await room.save();
        await fs.promises.writeFile(join(CovixConfig.FILE_PATH, `${roomId}.mp4`), file.buffer);
        return { roomId, usernames: [] };
    }

    public async addTrack(roomId: string, file: Express.Multer.File, lang: string): Promise<void> {
        const room = await this.roomModel.findOne({ id: roomId });
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        if (!room.tracks) {
            room.tracks = [];
        }
        await fs.promises.writeFile(join(CovixConfig.FILE_PATH, `${roomId}_${lang}.vtt`), file.buffer);
        room.tracks.push(lang);
        await room.save();
    } 

    public async getTracks(roomId: string): Promise<string[]> {
        const room = await this.roomModel.findOne({ id: roomId });
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        return room.tracks;
    }

    public async joinRoom({ roomId, user: { username, clientId } }: {
        roomId: string;
        user: {
            username: string;
            clientId: string;
        }
    }): Promise<void> {
        const user: UserDocument = await this.userService.saveUser(username, clientId, roomId);
        const room = await this.roomModel.findOne({ id: roomId });
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        if (!room.users.find(({ _id }) => user._id === _id)) {
            room.users.push(user);
            await room.save();
        }
    }

    public async leaveRoom({ roomId, clientId }: {
        roomId: string;
        clientId: string;
    }): Promise<void> {
        const room = await this.roomModel.findOne({ id: roomId });
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        const [ user ] = await this.userService.getUsersBy({ clientId });
        if (user) {
            const index = room.users.findIndex(({ _id }) => _id.equals(user._id));
            if (index > -1) {
                room.users.splice(index, 1);
                await room.save();
            }
        }
    }

    public async getUsers(roomId: string): Promise<UserDocument[]> {
        const room = await this.roomModel.findOne({ id: roomId }).populate("users", null, User.name);
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        return room.users;
    }

}