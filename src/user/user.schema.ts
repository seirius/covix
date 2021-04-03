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
    createdAt: Date;

    @Prop()
    roomId: string;

    public asDocument(): UserDocument {
        return <any>this as UserDocument;
    }
}

export const UserSchema = SchemaFactory.createForClass(User);