import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShowTracker, ShowTrackerDocument } from "./show-tracker.schema";

@Injectable()
export class ShowTrackerService {

    constructor(
        @InjectModel(ShowTracker.name)
        public readonly showTrackerModel: Model<ShowTrackerDocument>
    ) { }

}