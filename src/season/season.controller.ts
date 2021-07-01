import { Controller } from "@nestjs/common";
import { SeasonService } from "./season.service";

@Controller("api/season")
export class SeasonController {

    constructor(
        private readonly seasonService: SeasonService
    ) {}

}