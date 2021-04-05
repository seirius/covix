import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { File } from "src/file/file.schema";
import { Media } from "src/media/media.schema";

export type MovieDocument = Movie & Document;

@Schema()
export class Movie extends Document {
    @Prop()
    label: string;

    @Prop({
        type: Types.ObjectId,
        ref: Media.name
    })
    media: Media;

    @Prop({
        default: Date.now
    })
    createdAt: Date;

    @Prop()
    iconUrl: string;

    @Prop({
        type: Types.ObjectId,
        ref: File.name
    })
    icon: File;

    public asDocument(): MovieDocument {
        return this as MovieDocument;
    }
}

export const MovieSchema = SchemaFactory.createForClass(Movie);