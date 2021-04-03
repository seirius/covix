import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MediaModule } from "src/media/media.module";
import { UserModule } from "src/user/user.module";
import { RoomController } from "./room.controller";
import { RoomCron } from "./room.cron";
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
        UserModule,
        MediaModule
    ],
    providers: [
        RoomGateway,
        RoomService,
        RoomCron
    ],
    exports: [RoomService],
    controllers: [RoomController]
})
export class RoomModule {}