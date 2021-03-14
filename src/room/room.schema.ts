import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { CovixConfig } from "src/config/CovixConfig";
import { User, UserDocument } from "src/user/user.schema";

export type RoomDocument = Room & Document;

@Schema()
export class Room {
    @Prop()
    roomId: string;

    @Prop({
        type: [Types.ObjectId],
        ref: User.name
    })
    users: UserDocument[];

    @Prop()
    tracks: string[];

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
}

export const RoomSchema = SchemaFactory.createForClass(Room);