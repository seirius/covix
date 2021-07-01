import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Media } from "src/media/media.schema";
import { TvShow } from "src/tv-show/tv-show.schema";
import { User } from "src/user/user.schema";

export type ShowTrackerDocument = ShowTracker & Document;

@Schema()
export class ShowTracker {

    _id: string;

    @Prop({
        type: Types.ObjectId,
        ref: User.name
    })
    user: User;

    @Prop({
        type: Types.ObjectId,
        ref: TvShow.name
    })
    tvShow: TvShow;

    @Prop({
        type: Types.ObjectId,
        ref: Media.name
    })
    media: Media;

}

export const ShowTrackerSchema = SchemaFactory.createForClass(ShowTracker);
