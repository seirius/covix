import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./user.schema";

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name)
        public readonly userModel: Model<UserDocument>
    ) {}

    public async saveUser(username: string, clientId: string, roomId: string): Promise<UserDocument> {
        let user = await this.userModel.findOne({ username, roomId });
        if (!user) {
            user = new this.userModel({
                username, clientId, roomId
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
    }): Promise<User[]> {
        const users = await this.userModel.find({
            _id: by._id,
            username: by.username,
            clientId: by.clientId,
            createdAt: by.createdAt
        });
        return users;
    }

}