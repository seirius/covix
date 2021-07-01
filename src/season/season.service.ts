import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { File } from "src/file/file.schema";
import { Media } from "src/media/media.schema";
import { MediaService } from "src/media/media.service";
import { AddEpisodeArgs, RemoveEpisodeArgs, SeasonResponse, UpdateSeasonIndexArgs } from "./season.dto";
import { Season, SeasonDocument } from "./season.schema";

@Injectable()
export class SeasonService {

    constructor(
        @InjectModel(Season.name)
        public readonly seasonModel: Model<SeasonDocument>,
        private readonly mediaService: MediaService
    ) { }

    public async deleteSeason(id: string): Promise<Season> {
        const season = await this.seasonModel.findById(id);
        if (season) {
            if (season.medias?.length) {
                await Promise
                .all(season.medias.map(mediaId => 
                    this.mediaService.deleteMedia(mediaId._id)));
            }
            await season.delete();
            const seasonsToUpdate = await this.seasonModel.find({
                tvShow: season.tvShow,
                index: {
                    $gt: season.index
                }
            });
            await Promise.all(seasonsToUpdate.map(seasonToUpdate => {
                seasonToUpdate.index -= 1;
                return seasonToUpdate.save();
            }));
        }
        return season;
    }

    public async addEpisode({
        seasonId,
        filename,
        index
    }: AddEpisodeArgs): Promise<void> {
        const season = await this.seasonModel
        .findById(seasonId);
        if (!season) {
            throw new NotFoundException(`Season not found ${seasonId}`);
        }
        const media = await this.mediaService.createMedia(filename);
        if (index === undefined || index === null) {
            index = season.medias.length;
        }
        season.medias.splice(index, 0, media);
        await season.save();
    }

    public async removeEpisode({
        seasonId, mediaId
    }: RemoveEpisodeArgs): Promise<Season> {
        const season = await this.seasonModel.findById(seasonId)
        .populate({
            path: "medias",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        });
        if (!season) {
            throw new NotFoundException(`Season not found ${seasonId}`);
        }
        const index = season.medias.findIndex(({ _id }) => Types.ObjectId(mediaId).equals(_id));
        if (index > -1) {
            season.medias.splice(index, 1);
            await this.mediaService.deleteMedia(mediaId);
        }
        return season.save();
    }

    public async updateSeasonIndex({ seasonId, index }: UpdateSeasonIndexArgs): Promise<Season> {
        const season = await this.seasonModel.findById(seasonId);
        if (!season) {
            throw new NotFoundException("Season not found");
        }
        const seasons = await this.seasonModel.find({
            tvShow: season.tvShow
        });
        let seasonsLength = seasons.length - 1;
        if (index > seasonsLength) {
            index = seasonsLength;
        }
        await this.seasonModel.updateOne({
            tvShow: season.tvShow,
            index
        }, { index: season.index });
        season.index = index;
        return season.save();
    }

}