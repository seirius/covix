import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Media } from "src/media/media.schema";
import { User } from "src/user/user.schema";

export type RoomDocument = Room & Document;

@Schema()
export class Room extends Document {
    _id: string;

    @Prop()
    roomId: string;

    @Prop({
        type: Types.ObjectId,
        ref: Media.name
    })
    media: Media;

    @Prop({
        type: [Types.ObjectId],
        ref: User.name
    })
    users: User[];

    @Prop({
        default: 0
    })
    currentTime: number;

    @Prop({
        default: Date.now
    })
    createdAt: Date;

    @Prop({
        default: Date.now
    })
    lastUserDate: Date;

    @Prop({
        type: Types.ObjectId,
        ref: User.name
    })
    owner: User;
}

export const RoomSchema = SchemaFactory.createForClass(Room);