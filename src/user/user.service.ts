import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./user.schema";

export interface SaveUser {
    username: string;
    clientId?: string;
}

export interface UserResponse {
    id: string;
    username: string;
    clientId: string;
    createdAt: number;
}

export function userAsResponse(user: User): UserResponse {
    return {
        id: user._id,
        username: user.username,
        clientId: user.clientId,
        createdAt: user.createdAt?.getTime()
    };
}

export interface UpdateUserClientID {
    clientId: string;
}

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name)
        public readonly userModel: Model<UserDocument>
    ) {}

    public async saveUser({ username, clientId }: SaveUser): Promise<UserDocument> {
        let user = await this.userModel.findOne({ username });
        if (!user) {
            user = new this.userModel({
                username, clientId
            });
        } else {
            user.username = username;
            user.clientId = clientId;
        }
        user.createdAt = new Date();
        await user.save();
        return user;
    }

    public async getUsersBy(by: {
        _id?: string;
        username?: string;
        clientId?: string;
        createdAt?: Date;
    }): Promise<UserDocument[]> {
        const users = await this.userModel.find(by);
        return users;
    }

    public async userLeft(username: string): Promise<void> {
        const user = await this.userModel.findOne({ username });
        if (user) {
            user.clientId = null;
            await user.save();
        }
    }

}