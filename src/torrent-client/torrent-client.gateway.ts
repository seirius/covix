import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { CovixConfig } from "src/config/CovixConfig";
import { EVENTS } from "src/util/socket-events";
import { TorrentResponse } from "./torrent-client.data";

@WebSocketGateway(CovixConfig.SOCKET_PORT)
export class TorrentClientGateway {

    @WebSocketServer()
    public server: Server;

    public broadcastTorrentProgress(args: TorrentResponse): void {
        this.server.sockets.emit(`${EVENTS.TORRENT_UPDATE}/${args.name}`, args);
    }

}