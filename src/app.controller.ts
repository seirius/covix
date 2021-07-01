import { Controller, Get } from "@nestjs/common";
import { CovixConfig } from "./config/CovixConfig";


@Controller("/api")
export class AppController {
    constructor(
    ) { }

    @Get("socket-path")
    public getSocketPath(): { socketPath: string } {
        return { socketPath: CovixConfig.SOCKET_PATH };
    }

}
