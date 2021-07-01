import { mediaAsResponse, MediaResponse } from "src/media/media.data";
import { tvShowAsResponse, TvShowResponse } from "src/tv-show/tv-show.dto";
import { userAsResponse, UserResponse } from "src/user/user.service";
import { ShowTracker } from "./show-tracker.schema";

export class AddShowTrackerArgs {
    username: string;
    tvShowId: string;
    mediaId: string;
}

export interface ShowTrackerResponse {
    user: UserResponse;
    tvShow: TvShowResponse;
    media: MediaResponse;
}

export function showTrackerAsResponse({
    user, tvShow, media
}: ShowTracker): ShowTrackerResponse {
    return {
        user: user ? userAsResponse(user) : null,
        tvShow: tvShow ? tvShowAsResponse(tvShow) : null,
        media: media ? mediaAsResponse(media) : null
    };
}