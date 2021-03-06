import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Media } from "src/media/media.schema";
import { TvShow } from "src/tv-show/tv-show.schema";

export type SeasonDocument = Season & Document;

@Schema()
export class Season {

    _id: string;

    @Prop({
        type: Types.ObjectId,
        ref: TvShow.name
    })
    tvShow: TvShow;

    @Prop()
    label: string;

    @Prop({
        type: [Types.ObjectId],
        ref: Media.name
    })
    medias: Media[];

    @Prop()
    index: number; 

    public asDocument(): SeasonDocument {
        return <any>this as SeasonDocument;
    }

}

export const SeasonSchema = SchemaFactory.createForClass(Season);
