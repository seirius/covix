import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

@Schema()
export class User {
    _id: string;

    @Prop()
    username: string;

    @Prop()
    clientId: string;

    @Prop({
        default: Date.now
    })
    createAt: Date;

    @Prop()
    roomId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);