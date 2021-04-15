import { Controller, Delete, Get, Param, Put, Query } from "@nestjs/common";
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

    @Delete("")
    public async deleteTorrent(
        @Query("id")
        id: string
    ): Promise<void> {
        await this.torrentClientService.removeTorrent(id);
    }

    @Put("state/:id/pause")
    public async pauseTorrent(
        @Param("id")
        id: string
    ): Promise<void> {
        await this.torrentClientService.pauseTorrent(id);
    }

    @Put("state/:id/resume")
    public async resumeTorrent(
        @Param("id")
        id: string
    ): Promise<void> {
        await this.torrentClientService.resumeTorrent(id);
    }

}