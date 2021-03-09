import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RoomGateway } from "./room.gateway";
import { Room, RoomSchema } from "./room.schema";
import { RoomService } from "./room.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Room.name,
                schema: RoomSchema
            }
        ]),
    ],
    providers: [
        RoomGateway,
        RoomService,
    ],
    exports: [RoomService]
})
export class RoomModule {}