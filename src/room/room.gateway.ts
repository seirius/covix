import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { CovixConfig } from "src/config/CovixConfig";
import { FileResponse } from "src/file/file.data";
import { UserService } from "src/user/user.service";
import { RoomService } from "./room.service";

export const EVENTS = {
    JOIN_ROOM: "join-room",
    LEAVE_ROOM: "leave-room",
    JOINED_ROOM: "joined-room",
    PLAY: "play",
    PAUSE: "pause",
    NEW_TRACK: "new-track",
    REQUEST_CURRENT_TIME: "request-current-time"
};

@WebSocketGateway(CovixConfig.SOCKET_PORT)
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    public server: Server;

    constructor(
        private roomService: RoomService,
        private userService: UserService
    ) {
    }

    public async getClients(roomId: string, ignoreClients: string[] = []): Promise<Socket[]> {
        const users = await this.roomService.getUsers(roomId);
        return users
            .filter(({ clientId }) => !ignoreClients.includes(clientId))
            .map(({ clientId }) => this.server.clients().sockets[clientId])
            .filter(client => client);
    }

    public async broadcast(roomId: string, event: string, args: any, ignoreClients: string[] = []): Promise<void> {
        const clients = await this.getClients(roomId, ignoreClients);
        clients
            .forEach(client => client.emit(event, args));
    }

    @SubscribeMessage(EVENTS.JOIN_ROOM)
    public async joinRoom(
        @MessageBody() { roomId, username }: {
            roomId: string;
            username: string;
        },
        @ConnectedSocket() socket: Socket
    ): Promise<WsResponse<boolean>> {
        await this.roomService.joinRoom({
            roomId,
            user: {
                username,
                clientId: socket.id
            }
        });
        this.broadcast(roomId, EVENTS.JOINED_ROOM, username);
        return {
            event: EVENTS.JOIN_ROOM,
            data: true
        };
    }

    @SubscribeMessage(EVENTS.LEAVE_ROOM)
    public async leaveRoom(
        @MessageBody() { roomId }: {
            roomId: string;
        },
        @ConnectedSocket() socket: Socket
    ): Promise<WsResponse<boolean>> {
        await this.roomService.leaveRoom({
            roomId,
            clientId: socket.id
        });
        const [{ username }] = await this.userService.getUsersBy({ clientId: socket.id });
        this.broadcast(roomId, EVENTS.LEAVE_ROOM, username);
        return {
            event: EVENTS.LEAVE_ROOM,
            data: true
        };
    }

    @SubscribeMessage(EVENTS.PLAY)
    public async playVideo(
        @MessageBody() { roomId, currentTime }: {
            roomId: string;
            currentTime: number;
        },
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        this.broadcast(roomId, EVENTS.PLAY, { currentTime }, [socket.id]);
    }

    @SubscribeMessage(EVENTS.PAUSE)
    public async pauseVideo(
        @MessageBody() { roomId, currentTime }: {
            roomId: string;
            currentTime: number;
        },
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        this.broadcast(roomId, EVENTS.PAUSE, { currentTime }, [socket.id]);
    }

    @SubscribeMessage(EVENTS.NEW_TRACK)
    public async newTrack(
        @MessageBody() { roomId, track }: {
            roomId: string;
            track: FileResponse;
        },
        @ConnectedSocket() socket: Socket
    ): Promise<void> {
        this.broadcast(roomId, EVENTS.NEW_TRACK, track);
    }

    @SubscribeMessage(EVENTS.REQUEST_CURRENT_TIME)
    public newCurrentTime(
        @MessageBody() { roomId, currentTime }: {
            roomId: string;
            currentTime: number;
        }
    ): Promise<void> {
        return this.roomService.updateCurrentTime(roomId, currentTime);
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log("client connected", client.id);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        const users = await this.userService.getUsersBy({ clientId: client.id });
        if (users.length) {
            users.forEach(async ({ username, roomId }) => {
                await this.roomService.leaveRoom({
                    roomId,
                    clientId: client.id
                });
                this.broadcast(roomId, EVENTS.LEAVE_ROOM, username);
            });
        }
    }

}