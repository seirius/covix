import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as fs from "fs";
import { Model } from "mongoose";
import { join } from "path";
import { CovixConfig } from "src/config/CovixConfig";
import { User, UserDocument } from "src/user/user.schema";
import { UserService } from "src/user/user.service";
import { v4 as uuid } from "uuid";
import { RoomResponse, RoomDto } from "./room.dto";
import { Room, RoomDocument } from "./room.schema";

const MESSAGES = {
    ROOM_NOT_FOUND: "Room doesn't exist"
}

const PATHS = {
    getRoomPath: function (roomId: string): string {
        return join(CovixConfig.FILE_PATH, `${roomId}.mp4`);
    },
    getVttPath: function (roomId: string, lang: string): string {
        return join(CovixConfig.FILE_PATH, `${roomId}_${lang}.vtt`);
    }
};

@Injectable()
export class RoomService {

    constructor(
        @InjectModel(Room.name)
        public readonly roomModel: Model<RoomDocument>,
        private readonly userService: UserService
    ) {}

    public async removeVideo(roomId: string): Promise<void> {
        await fs.promises.unlink(PATHS.getRoomPath(roomId));
    }

    public async removeVtt(roomId: string, lang: string): Promise<void> {
        await fs.promises.unlink(PATHS.getVttPath(roomId, lang));
    }

    public async newRoom(file: Express.Multer.File): Promise<RoomResponse> {
        const roomId = uuid();
        const room = new this.roomModel({ roomId });
        await room.save();
        await fs.promises.writeFile(PATHS.getRoomPath(roomId), file.buffer);
        return { roomId, usernames: [] };
    }

    public async addTrack(roomId: string, file: Express.Multer.File, lang: string): Promise<void> {
        const room = await this.roomModel.findOne({ roomId });
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        if (!room.tracks) {
            room.tracks = [];
        }
        await fs.promises.writeFile(PATHS.getVttPath(roomId, lang), file.buffer);
        room.tracks.push(lang);
        await room.save();
    } 

    public async getTracks(roomId: string): Promise<string[]> {
        const room = await this.roomModel.findOne({ roomId });
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
        const room = await this.roomModel.findOne({ roomId });
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
        const room = await this.roomModel.findOne({ roomId });
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        const [ user ] = await this.userService.getUsersBy({ clientId });
        if (user) {
            const index = room.users.findIndex(({ _id }) => _id.equals(user._id));
            if (index > -1) {
                room.users.splice(index, 1);
                room.lastUserDate = new Date();
                await room.save();
            }
            await this.userService.userModel.deleteOne({ clientId });
        }
    }

    public async getUsers(roomId: string): Promise<UserDocument[]> {
        const room = await this.roomModel.findOne({ roomId }).populate("users", null, User.name);
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        return room.users;
    }

    public async updateCurrentTime(roomId: string, currentTime: number): Promise<void> {
        if (roomId && !isNaN(currentTime)) {
            const room = await this.roomModel.findOne({ roomId });
            if (room) {
                room.currentTime = currentTime;
                await room.save();
            }
        }
    }

    public async getRoom(roomId: string): Promise<RoomDto> {
        const { users, tracks, currentTime } = await this.roomModel.findOne({ roomId })
            .populate("users", null, User.name);
        return {
            roomId,
            users: users.map(({ username }) => username),
            tracks,
            currentTime
        };
    }

    public isExpired(room: Room): boolean {
        return new Date().getTime() - room.lastUserDate.getTime() > CovixConfig.ROOM_EXPIRE_TIME * 1000;
    }

    public async deleteRoom(roomId: string): Promise<void> {
        const room = await this.roomModel.findOne({ roomId });
        if (room) {
            await this.userService.userModel.deleteMany({ roomId });
            let tracks = [];
            if (room.tracks) {
                tracks = room.tracks;
            }
            await Promise.all([
                ...tracks.map(track => this.removeVtt(roomId, track)),
                this.removeVideo(roomId)
            ]);
            await this.roomModel.deleteOne({ roomId });
        }
    }

}