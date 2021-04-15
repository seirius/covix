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
        feed?: string;
        speed?: number;
    }): Promise<Torrent> {
        const torrent = new this.torrentModel({
            infoHash: args.infoHash,
            file: args.file,
            speed: args.speed,
            name: args.name,
            feed: args.feed,
            progress: args.progress,
            state: args.state
        });
        await torrent.save();
        return torrent;
    }

    private async add(feed: string, torrentDoc?: Torrent): Promise<{
        torrent: WebTorrent.Torrent;
        mp4File: WebTorrent.TorrentFile;
    }> {
        return new Promise(async (resolve, reject) => {
            this.client.add(feed, { path: await getTorrentTmpPath() }, async (torrent) => {
                const [ mp4File ] = torrent.files.filter(({ name }) => path.extname(name) === ".mp4");
                if (!mp4File) {
                    torrent.destroy();
                    await this.removeTmpFiles(torrent.name);
                    reject("No mp4 files to download");
                    return;
                }
                resolve({
                    torrent,
                    mp4File
                });
            });
        });
    }

    private onTorrentDownload(id: string, torrent: WebTorrent.Torrent): void {
        let time = new Date().getTime();
        let executing = false;
        torrent.on("download", async () => {
            if (!executing) {
                executing = true;
                const currentTime = new Date().getTime();
                if (currentTime - time > CovixConfig.TORRENT_UPDATE_STATE_INTERVAL) {
                    time = currentTime;
                    const auxTorrentDoc = await this.torrentModel.findById(id);                        
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
    }

    private onTorrentDone(id: string, torrent: WebTorrent.Torrent): void {
        torrent.on("done", () => {
            console.log("Torrent done downloading: " + torrent.name);
            setTimeout(async () => {
                const auxTorrentDoc = await this.torrentModel.findById(id);                        
                await auxTorrentDoc.remove();
                torrent.destroy({ destroyStore: true });
                this.torrentGateway.broadcastTorrentDelete({ id: auxTorrentDoc._id });
            }, 5000);
        });
    }

    private torrentToStorage(file: WebTorrent.TorrentFile, path: string): void {
        file
        .createReadStream()
        .pipe(fs.createWriteStream(getFilePath(path)));
    }

    public async addTorrent(feed: string): Promise<{ file: File; torrent: Torrent }> {
        const { torrent, mp4File } = await this.add(feed);
        const internalFileName = uuid() + path.extname(mp4File.name);
        this.torrentToStorage(mp4File, internalFileName);
        const file = await this.fileService.saveFile(internalFileName, mp4File.name);
        const torrentDoc = await this.createTorrentDoc({
            name: torrent.name, progress: 0, infoHash: torrent.infoHash, file, feed
        });
        this.torrentGateway.broadcastTorrentAdd(torrentAsResponse(torrentDoc));
        this.onTorrentDownload(torrentDoc._id, torrent);
        this.onTorrentDone(torrentDoc._id, torrent);
        return {
            file,
            torrent: torrentDoc
        };
    }

    public async removeTorrent(id: string): Promise<void> {
        const torrent = await this.torrentModel.findById(id)
        .populate("file", null, File.name);
        if (!torrent) {
            throw new NotFoundException("Torrent not found");
        }
        const clientTorrent = this.client.get(torrent.infoHash);
        if (clientTorrent) {
            clientTorrent.destroy({
                destroyStore: true
            });
        } else {
            console.warn(`No torrent track found to destroy ${torrent.name}`);
        }
        await torrent.remove();
        this.torrentGateway.broadcastTorrentDelete({ id });
    }

    public async pauseTorrent(id: string): Promise<void> {
        const torrent = await this.torrentModel.findById(id);
        if (!torrent) {
            throw new NotFoundException("Torrent not found");
        }
        const clientTorrent = this.client.get(torrent.infoHash);
        if (clientTorrent) {
            clientTorrent.destroy();
        } else {
            console.warn(`No torrent track found to pause ${torrent.name}`);
        }
        torrent.state = TorrentState.PAUSED;
        torrent.speed = 0;
        await torrent.save();
        this.torrentGateway.broadcastTorrentPause(torrentAsResponse(torrent));
    }

    public async resumeTorrent(id: string): Promise<void> {
        const torrentDoc = await this.torrentModel.findById(id)
        .populate("file", null, File.name);
        if (!torrentDoc) {
            throw new NotFoundException("Torrent not found");
        }
        const { torrent, mp4File } = await this.add(torrentDoc.feed);
        torrentDoc.state = TorrentState.START;
        await torrentDoc.save();
        this.torrentToStorage(mp4File, torrentDoc.file.name);
        this.torrentGateway.broadcastTorrentAdd(torrentAsResponse(torrentDoc));
        this.onTorrentDownload(torrentDoc._id, torrent);
        this.onTorrentDone(torrentDoc._id, torrent);

    }

    onModuleDestroy() {
        this.client.destroy();
    }

}