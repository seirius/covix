import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { File } from "src/file/file.schema";

export type TvShowDocument = TvShow & Document;

@Schema()
export class TvShow {

    _id: string;

    @Prop()
    label: string;

    @Prop()
    iconUrl: string;

    @Prop({
        type: Types.ObjectId,
        ref: File.name
    })
    icon: File;

}

export const TvShowSchema = SchemaFactory.createForClass(TvShow);