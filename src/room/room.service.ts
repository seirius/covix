import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CovixConfig } from "src/config/CovixConfig";
import { File } from "src/file/file.schema";
import { Media } from "src/media/media.schema";
import { MediaService } from "src/media/media.service";
import { User, UserDocument } from "src/user/user.schema";
import { UserService } from "src/user/user.service";
import { v4 as uuid } from "uuid";
import { RoomDto, RoomResponse } from "./room.dto";
import { Room, RoomDocument } from "./room.schema";

const MESSAGES = {
    ROOM_NOT_FOUND: "Room doesn't exist"
}

@Injectable()
export class RoomService {

    constructor(
        @InjectModel(Room.name)
        public readonly roomModel: Model<RoomDocument>,
        private readonly userService: UserService,
        private readonly mediaService: MediaService,
    ) {}

    public async newRoom(mediaId: string): Promise<RoomResponse> {
        const media = await this.mediaService.mediaModel.findById(mediaId);
        if (!media) {
            throw new NotFoundException("No media found");
        }
        const roomId = uuid();
        const room = new this.roomModel({ 
            roomId,
            media,
        });
        await room.save();
        return { roomId, usernames: [] };
    }

    public async getTracks(roomId: string): Promise<string[]> {
        const room = await this.roomModel.findOne({ roomId })
        .populate({
            path: "media",
            model: Media.name,
            populate: {
                path: "tracks",
                model: File.name
            }
        });
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        return room.media.tracks?.map(file => file.originalName);
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
        const room = await this.roomModel.findOne({ roomId })
        .populate("users", null, User.name);
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        const [ user ] = await this.userService.getUsersBy({ clientId });
        if (user) {
            const index = room.users.findIndex(({ _id }) => _id === user._id);
            if (index > -1) {
                room.users.splice(index, 1);
                room.lastUserDate = new Date();
                await room.save();
            }
            await this.userService.userModel.deleteOne({ clientId });
        }
    }

    public async getUsers(roomId: string): Promise<User[]> {
        const room = await this.roomModel.findOne({ roomId })
        .populate("users", null, User.name);
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
        const room = await this.roomModel.findOne({ roomId })
            .populate("users", null, User.name)
            .populate("media", null, Media.name);
        if (!room) {
            throw new NotFoundException("Room not found");
        }
        return {
            roomId,
            users: room.users?.map(({ username }) => username),
            currentTime: room.currentTime,
            mediaId: room.media._id
        };
    }

    public isExpired(room: Room): boolean {
        return new Date().getTime() - room.lastUserDate.getTime() > CovixConfig.ROOM_EXPIRE_TIME * 1000;
    }

    public async deleteRoom(roomId: string): Promise<void> {
        await this.roomModel.deleteOne({ roomId });
    }

}