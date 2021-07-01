import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShowTracker, ShowTrackerSchema } from "./show-tracker.schema";
import { ShowTrackerService } from "./show-tracker.service";

@Module({
    imports: [
        MongooseModule.forFeature([{
            name: ShowTracker.name,
            schema: ShowTrackerSchema
        }])
    ],
    providers: [ShowTrackerService],
    exports: [ShowTrackerService]
})
export class ShowTrackerModule {}