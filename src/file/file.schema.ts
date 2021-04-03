import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type FileDocument = File & Document;

@Schema()
export class File {
    
    @Prop()
    name: string;

    @Prop()
    originalName: string;
    
}

export const FileSchema = SchemaFactory.createForClass(File);