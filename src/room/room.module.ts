import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "src/user/user.module";
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
        UserModule
    ],
    providers: [
        RoomGateway,
        RoomService,
    ],
    exports: [RoomService]
})
export class RoomModule {}