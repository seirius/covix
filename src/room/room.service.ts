import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CovixConfig } from "src/config/CovixConfig";
import { File } from "src/file/file.schema";
import { Media } from "src/media/media.schema";
import { MediaService } from "src/media/media.service";
import { User } from "src/user/user.schema";
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

    public async newRoom(mediaId: string, username: string): Promise<RoomResponse> {
        const media = await this.mediaService.mediaModel.findById(mediaId);
        if (!media) {
            throw new NotFoundException("No media found");
        }
        const user = await this.userService.userModel.findOne({ username });
        if (!user) {
            throw new NotFoundException("No user found");
        }
        let room = await this.roomModel.findOne({
            media: media._id,
            owner: user._id
        })
        .populate("users", null, User.name)
        .populate("owner", null, User.name);
        let usernames = [];
        if (!room) {
            room = new this.roomModel({ 
                roomId: uuid(),
                media,
                owner: user
            });
            await room.save();
        } else {
            usernames = room.users.map(({ username }) => username);
        }
        return { roomId: room.roomId, usernames, owner: room.owner.username };
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

    public async joinRoom({ roomId, user: { username } }: {
        roomId: string;
        user: {
            username: string;
        }
    }): Promise<void> {
        const user = await this.userService.userModel.findOne({ username });
        const room = await this.roomModel.findOne({ roomId })
        .populate("users", null, User.name);
        if (!room) {
            throw new NotFoundException(MESSAGES.ROOM_NOT_FOUND);
        }
        if (!room.users.find(({ _id }) => user._id.equals(_id))) {
            room.users.push(user);
            await room.save();
        }
    }

    public async leaveRoom({ clientId }: {
        clientId: string;
    }): Promise<{ roomId: string; username: string; }> {
        const user = await this.userService.userModel.findOne({ clientId });
        let username: string, roomId: string;
        if (user) {
            const room = await this.roomModel
            .findOne({
                users: {
                    $in: [user]
                }
            }).populate("users", null, User.name);
            username = user.username;
            if (room) {
                roomId = room.roomId;
                const index = room.users.findIndex(({ _id }) => user._id.equals(_id));
                if (index > -1) {
                    room.users.splice(index, 1);
                    room.lastUserDate = new Date();
                    await room.save();
                }
            }
        }
        return { roomId, username };
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