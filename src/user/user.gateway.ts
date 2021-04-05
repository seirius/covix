import { OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { CovixConfig } from "src/config/CovixConfig";
import { EVENTS } from "src/util/socket-events";
import { UserService } from "./user.service";

@WebSocketGateway(CovixConfig.SOCKET_PORT)
export class UserGateway implements OnGatewayDisconnect, OnGatewayInit {

    @WebSocketServer()
    public server: Server;

    constructor(
        private readonly userService: UserService 
    ) {}

    async afterInit(server: any) {
        await this.userService.userModel.updateMany(null, { clientId: null });
    }

    public newUser(username: string): void {
        this.server.sockets.emit(EVENTS.NEW_USER, username);
    }

    public userLeft(username: string): void {
        this.server.sockets.emit(EVENTS.USER_LEFT, username);
    }

    public userJoined(username: string): void {
        this.server.sockets.emit(EVENTS.USER_JOINED, username);
    }

    public deleteUser(username: string): void {
        this.server.sockets.emit(EVENTS.USER_DELETED, username);
    }

    async handleDisconnect(client: Socket) {
        const user = await this.userService.userModel.findOne({ clientId: client.id });
        if (user) {
            await this.userService.userLeft(user.username);
            this.userLeft(user.username);
        }
    }

}