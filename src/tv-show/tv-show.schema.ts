import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Season, SeasonDocument } from "src/season/season.schema";

export type TvShowDocument = TvShow & Document;

@Schema()
export class TvShow {

    @Prop()
    label: string;

    @Prop({
        type: [Types.ObjectId],
        ref: Season.name
    })
    seasons: SeasonDocument[];

}

export const TvShowSchema = SchemaFactory.createForClass(TvShow);