import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { File } from "src/file/file.schema";
import { FileService } from "src/file/file.service";
import { Media } from "src/media/media.schema";
import { MediaService } from "src/media/media.service";
import { SeasonResponse } from "src/season/season.dto";
import { Season } from "src/season/season.schema";
import { SeasonService } from "src/season/season.service";
import { AddShowTrackerArgs } from "src/show-tracker/show-tracker.dto";
import { ShowTracker } from "src/show-tracker/show-tracker.schema";
import { ShowTrackerService } from "src/show-tracker/show-tracker.service";
import { User } from "src/user/user.schema";
import { UserService } from "src/user/user.service";
import { CreateEmptySeasonArgs, CreateShowArgs, UpdateEpisodeIndex, UpdateTvShowArgs } from "./tv-show.dto";
import { TvShow, TvShowDocument } from "./tv-show.schema";

@Injectable()
export class TvShowService {

    constructor(
        @InjectModel(TvShow.name)
        public readonly tvShowModel: Model<TvShowDocument>,
        private readonly seasonService: SeasonService,
        private readonly showTrackerService: ShowTrackerService,
        private readonly userService: UserService,
        private readonly mediaService: MediaService,
        private readonly fileService: FileService
    ) { }

    public async createTvShow({
        label, icon, iconUrl
    }: CreateShowArgs): Promise<TvShow> {
        const tvShowAux = await this.tvShowModel.findOne({ label });
        if (tvShowAux) {
            throw new ConflictException("TvShow already exists with the same name");
        }
        let iconFile: File;
        if (icon) {
            iconFile = await this.fileService.fileModel.findOne({ name: icon });
        }
        const tvShow = new this.tvShowModel({ label, iconUrl, icon: iconFile });
        return tvShow.save();
    }

    public async createEmptySeason({
        tvShowId,
        seasonLabel,
        index
    }: CreateEmptySeasonArgs): Promise<Season> {
        const tvShow = await this.tvShowModel
            .findById(tvShowId);
        if (!tvShow) {
            throw new NotFoundException(`TvShow not found ${tvShowId}`);
        }
        let season = await this.seasonService.seasonModel.findOne({
            tvShow: Types.ObjectId(tvShowId) as any,
            label: seasonLabel
        });
        if (season) {
            throw new ConflictException(`Season with name ${seasonLabel} aleady exists for ${tvShow.label}`);
        }
        if (!index) {
            index = await this.lastSeason(tvShowId);
        }
        season = await new this.seasonService.seasonModel({
            tvShow,
            label: seasonLabel,
            index
        }).save();
        return season;
    }

    public seasons(tvShowId: string): Promise<Season[]> {
        return this.seasonService.seasonModel.find({
            tvShow: Types.ObjectId(tvShowId) as any
        })
        .sort({ index: 1 }) as any;
    }

    public async lastSeason(tvShowId: string): Promise<number> {
        return (await this.seasons(tvShowId)).length;
    }

    public async deleteTvShow(id: string): Promise<void> {
        const tvShow = await this.tvShowModel.findById(id)
            .populate("icon", null, File.name);
        if (tvShow) {
            const seasons = await this.seasons(tvShow._id);
            if (seasons?.length) {
                await Promise
                    .all(seasons.map(season => this.seasonService.deleteSeason(season._id)));
            }
            if (tvShow.icon) {
                await this.fileService.deleteFile(tvShow.icon.name);
            }
            await tvShow.delete();
        }
    }

    public async addShowTracker({ username, tvShowId, mediaId }: AddShowTrackerArgs): Promise<ShowTracker> {
        const [user, tvShow] = await Promise.all([
            this.userService.userModel.findOne({ username }, { _id: 1 }),
            this.tvShowModel.findById(tvShowId, { _id: 1 })
        ]);
        if (!user || !tvShow) {
            throw new NotFoundException(`User or Tv show not found (${username}, ${tvShowId})`);
        }
        let showTracker = await this.showTrackerService.showTrackerModel.findOne({ 
            user: <any> Types.ObjectId(user._id),
            tvShow: <any> Types.ObjectId(tvShowId)
        });
        const media = await this.mediaService.mediaModel.findById(mediaId, { _id: 1 });
        if (!media) {
            throw new NotFoundException(`Media not found (${mediaId})`);
        }
        if (!showTracker) {
            showTracker = new this.showTrackerService.showTrackerModel({
                user, tvShow, media
            });
        } else {
            showTracker.media = media;
        }
        return showTracker.save();
    }

    public async updateTvShow(id: string, { label, iconUrl, icon }: UpdateTvShowArgs): Promise<TvShow> {
        const tvShow = await this.tvShowModel.findById(id)
            .populate("icon", null, File.name);
        if (!tvShow) {
            throw new NotFoundException(`Tv show not found ${id}`);
        }
        if (label) {
            tvShow.label = label;
        }
        if (icon || iconUrl) {
            if (tvShow.icon) {
                await this.fileService.deleteFile(tvShow.icon.name);
            }
            if (icon) {
                tvShow.icon = await this.fileService.fileModel.findOne({ name: icon });
                tvShow.iconUrl = null;
            }
            if (iconUrl) {
                tvShow.iconUrl = iconUrl;
            }
        }
        return tvShow.save();
    }

    public async getEpisode(tvShowId: string, userId: string): Promise<Media> {
        let media: Media;
        const showTracker = await this.showTrackerService.showTrackerModel.findOne({
            tvShow: Types.ObjectId(tvShowId) as any,
            user: <any> Types.ObjectId(userId)
        }).populate("media", null, Media.name);
        if (showTracker?.media) {
            media = showTracker.media;
        } else {
            const season = await this.seasonService.seasonModel.findOne({
                $where: "this.medias.length > 0",
                tvShow: Types.ObjectId(tvShowId) as any
            }, null, {
                sort: {
                    index: 1
                },
                limit: 1
            })
                .populate({
                    path: "medias",
                    model: Media.name,
                    populate: {
                        path: "file",
                        model: File.name
                    }
                });
            if (!season) {
                throw new NotFoundException(`There is no episodes available for the tv show ${tvShowId}`);
            }
            media = season.medias[0];
        }
        return media;
    }

    public async updateEpisodeIndex({ mediaId, index}: UpdateEpisodeIndex): Promise<Season> {
        const season = await this.seasonService.seasonModel.findOne({
            medias: <any> {
                $in: [Types.ObjectId(mediaId)]
            }
        }).populate({
            path: "medias",
            model: Media.name,
            populate: {
                path: "file",
                model: File.name
            }
        });
        if (!season) {
            throw new NotFoundException("Season not found");
        }
        const currentIndex = season.medias.findIndex(({ _id }) => _id.toString() === mediaId);
        if (index >= season.medias.length) {
            let k = index - season.medias.length + 1;
            while(k--) {
                season.medias.push(undefined);
            }
        }
        season.medias.splice(index, 0, season.medias.splice(currentIndex, 1)[0]);
        return season.save();
    }

}