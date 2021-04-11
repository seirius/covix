import { Injectable, NotFoundException, OnModuleDestroy } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as fs from "fs";
import { Model } from "mongoose";
import * as path from "path";
import * as rimraf from "rimraf";
import { CovixConfig } from "src/config/CovixConfig";
import { File } from "src/file/file.schema";
import { FileService, getFilePath, getTorrentTmpPath } from "src/file/file.service";
import { v4 as uuid } from "uuid";
import * as WebTorrent from "webtorrent";
import { torrentAsResponse } from "./torrent-client.data";
import { TorrentClientGateway } from "./torrent-client.gateway";
import { Torrent, TorrentDocument, TorrentState } from "./torrent.schema";

@Injectable()
export class TorrentClientService implements OnModuleDestroy {

    private readonly client: WebTorrent.Instance;

    constructor(
        @InjectModel(Torrent.name)
        public readonly torrentModel: Model<TorrentDocument>,
        private readonly fileService: FileService,
        private readonly torrentGateway: TorrentClientGateway
    ) {
        this.client = new WebTorrent();
    }

    public removeTmpFiles(name: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            rimraf(path.join(await getTorrentTmpPath(), name), error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    public async createTorrentDoc(args: {
        infoHash: string;
        name: string;
        file: File;
        progress: number;
        state?: TorrentState;
        speed?: number;
    }): Promise<Torrent> {
        const torrent = new this.torrentModel({
            infoHash: args.infoHash,
            file: args.file,
            speed: args.speed,
            name: args.name,
            progress: args.progress,
            state: args.state
        });
        await torrent.save();
        return torrent;
    }

    public addTorrent(feed: string): Promise<{ file: File; torrent: Torrent }> {
        return new Promise(async (resolve, reject) => {
            this.client.add(feed, {
                path: await getTorrentTmpPath(),
            }, async torrent => {
                const [ mp4File ] = torrent.files.filter(({ name }) => path.extname(name) === ".mp4");
                if (!mp4File) {
                    torrent.destroy();
                    await this.removeTmpFiles(torrent.name);
                    reject("No mp4 files to download");
                    return;
                }
                const internalFileName = uuid() + path.extname(mp4File.name);
                mp4File
                .createReadStream()
                .pipe(fs.createWriteStream(getFilePath(internalFileName)));
                const file = await this.fileService.saveFile(internalFileName, mp4File.name);
                const torrentDoc = await this.createTorrentDoc({
                    name: torrent.name, progress: 0, infoHash: torrent.infoHash, file
                });
                let time = new Date().getTime();
                let executing = false;
                torrent.on("download", async () => {
                    if (!executing) {
                        executing = true;
                        const currentTime = new Date().getTime();
                        if (currentTime - time > CovixConfig.TORRENT_UPDATE_STATE_INTERVAL) {
                            time = currentTime;
                            const auxTorrentDoc = await this.torrentModel.findById(torrentDoc._id);                        
                            auxTorrentDoc.progress = torrent.progress;
                            auxTorrentDoc.speed = torrent.downloadSpeed;
                            if (auxTorrentDoc.state === TorrentState.START) {
                                auxTorrentDoc.state = TorrentState.DONWLOADING;
                            }
                            await auxTorrentDoc.save();
                            this.torrentGateway.broadcastTorrentProgress(torrentAsResponse(auxTorrentDoc));
                        }
                        executing = false;
                    }
                });
                torrent.on("done", () => {
                    console.log("Torrent done downloading: " + torrent.name);
                    setTimeout(async () => {
                        const auxTorrentDoc = await this.torrentModel.findById(torrentDoc._id);                        
                        auxTorrentDoc.progress = 1;
                        auxTorrentDoc.speed = 0;
                        auxTorrentDoc.state = TorrentState.DONE;
                        await auxTorrentDoc.save();
                        this.torrentGateway.broadcastTorrentProgress(torrentAsResponse(auxTorrentDoc));
                    }, 5000);
                });
                resolve({
                    file,
                    torrent: torrentDoc
                });
            });
        });
    }

    public async removeTorrent(id: string): Promise<void> {
        const torrent = await this.torrentModel.findById(id);
        if (!torrent) {
            throw new NotFoundException("Torrent not found");
        }
        const clientTorrent = this.client.get(torrent.infoHash);
        if (clientTorrent) {
            clientTorrent.destroy({
                destroyStore: true
            });
        }
        await torrent.remove();
    }

    onModuleDestroy() {
        this.client.destroy();
    }

}