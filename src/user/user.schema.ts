import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

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
}

export const UserSchema = SchemaFactory.createForClass(User);