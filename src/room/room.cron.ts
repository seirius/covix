import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { RoomService } from "./room.service";
import { CronJob, job } from "cron";
import { CovixConfig } from "src/config/CovixConfig";
import { User } from "src/user/user.schema";
import { RoomGateway } from "./room.gateway";
import { EVENTS } from "src/util/socket-events";
import { Media } from "src/media/media.schema";

// '* * * * * *' - runs every second
// '*/5 * * * * *' - runs every 5 seconds
// '10,20,30 * * * * *' - run at 10th, 20th and 30th second of every minute
// '0 * * * * *' - runs every minute
// '0 0 * * * *' - runs every hour (at 0 minutes and 0 seconds)

@Injectable()
export class RoomCron implements OnModuleDestroy {

    private isRunningRoomCurrentTime = false;
    private cronJobs: CronJob[] = [];

    constructor(
        private readonly roomService: RoomService,
        private readonly roomGateway: RoomGateway
    ) {
        this.init();
    }

    public init(): void {
        this.cronJobs.push(job(CovixConfig.CRON_JOIN_ROOM_CURRENT_TIME, async () => {
            if (!this.isRunningRoomCurrentTime) {
                this.isRunningRoomCurrentTime = true;
                try {
                    const rooms = await this.roomService.roomModel.find()
                    .populate("owner", null, User.name)
                    .populate("media", null, Media.name);
                    if (rooms.length) {
                        await Promise.all(rooms.map(async room => {
                            if (room.users?.length) {
                                const { sockets } = this.roomGateway.server.clients();
                                if (!room.owner || !room.media) {
                                    await this.roomService.deleteRoom(room.roomId);
                                } else {
                                    const ownerSocket = sockets[room.owner.clientId];
                                    if (ownerSocket?.connected) {
                                        ownerSocket.emit(EVENTS.REQUEST_CURRENT_TIME);
                                    }
                                }
                            }
                        }));
                    }
                } finally {
                    this.isRunningRoomCurrentTime = false;
                }
            }
        }));
        this.cronJobs.forEach(job => job.start());
    }
    
    onModuleDestroy() {
        this.cronJobs.forEach(job => job.stop());
    }

}