import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { CovixConfig } from "src/config/CovixConfig";
import { RoomService } from "./room.service";

const EVENTS = {
    JOIN_ROOM: "join-room",
    LEAVE_ROOM: "leave-room",
    JOINED_ROOM: "joined-room"
};

@WebSocketGateway(CovixConfig.SOCKET_PORT)
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    public server: Server;

    constructor(
        private roomService: RoomService
    ) {
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
        const users = await this.roomService.getUsers(roomId);
        console.log(users);
        users
            .forEach(({ clientId }) => 
                this.server.sockets
                .to(clientId)
                .emit(EVENTS.JOINED_ROOM, username)
            );
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
        return {
            event: EVENTS.LEAVE_ROOM,
            data: true
        };
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log("client connected", client.id);
    }

    handleDisconnect(client: any) {
        console.log("client disconnected", client.id);
    }

}