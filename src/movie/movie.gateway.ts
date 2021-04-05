import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { CovixConfig } from "src/config/CovixConfig";
import { EVENTS } from "src/util/socket-events";

@WebSocketGateway(CovixConfig.SOCKET_PORT)
export class MovieGateway {

    @WebSocketServer()
    public server: Server;

    public movieDeleted(id: string): void {
        this.server.sockets.emit(EVENTS.MOVIE_DELETE, id);
    }

}