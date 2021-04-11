import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { File } from "src/file/file.schema";

export type TorrentDocument = Torrent & Document;

export enum TorrentState {
    DONWLOADING = "downloading",
    START = "start",
    DONE = "done",
    ERROR = "error"
}

@Schema()
export class Torrent {
    _id: string;

    @Prop()
    infoHash: string;

    @Prop()
    name: string;

    @Prop()
    progress: number;

    @Prop({
        default: TorrentState.START
    })
    state: TorrentState;

    @Prop()
    speed: number;

    @Prop({
        type: Types.ObjectId,
        ref: File.name
    })
    file: File;
}

export const TorrentSchema = SchemaFactory.createForClass(Torrent);