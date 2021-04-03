import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { File } from "src/file/file.schema";

export type MediaDocument = Media & Document;

@Schema()
export class Media {
    _id: string;

    @Prop({
        type: Types.ObjectId,
        ref: File.name
    })
    file: File;

    @Prop({
        type: [Types.ObjectId],
        ref: File.name
    })
    tracks?: File[];

    public asDocument(): MediaDocument {
        return <any>this as MediaDocument;
    }

}

export const MediaSchema = SchemaFactory.createForClass(Media);
