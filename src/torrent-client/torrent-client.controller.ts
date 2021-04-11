import { Controller, Get } from "@nestjs/common";
import { torrentAsResponse } from "./torrent-client.data";
import { TorrentClientService } from "./torrent-client.service";

@Controller("/api/torrent-client")
export class TorrentClientController {

    constructor(
        private readonly torrentClientService: TorrentClientService
    ) { }

    @Get("list")
    public async getTorrents() {
        const torrents = await this.torrentClientService.torrentModel.find();
        return torrents.map(torrentAsResponse);
    }

}