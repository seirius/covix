import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Media } from "src/media/media.schema";

export type SeasonDocument = Season & Document;

@Schema()
export class Season {

    @Prop()
    label: string;

    @Prop({
        type: [Types.ObjectId],
        ref: Media.name
    })
    medias: Media[];

    public asDocument(): SeasonDocument {
        return <any>this as SeasonDocument;
    }

}

export const SeasonSchema = SchemaFactory.createForClass(Season);
