import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User, UserDocument } from "src/user/user.schema";

export type RoomDocument = Room & Document;

@Schema()
export class Room {
    @Prop()
    id: string;

    @Prop({
        type: [Types.ObjectId],
        ref: User.name
    })
    users: UserDocument[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);