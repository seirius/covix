import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { CovixConfig } from "src/config/CovixConfig";
import { JoinRoomDto, LeaveRoomDto } from "./room.dto";

@WebSocketGateway(CovixConfig.SOCKET_PORT)
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @SubscribeMessage("join-room")
    public joinRoom(
        @MessageBody() joinRoomDto: JoinRoomDto,
        @ConnectedSocket() socket: Socket
    ) {
        console.log("room joined");
        return joinRoomDto;
    }

    @SubscribeMessage("leave-room")
    public leaveRoom(
        @MessageBody() leaveRoomDto: LeaveRoomDto,
        @ConnectedSocket() socket: Socket
    ) {
        console.log("room left");
        return leaveRoomDto;
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log("client connected", client.id);
    }

    handleDisconnect(client: any) {
        console.log("client disconnected", client.id);
    }

}