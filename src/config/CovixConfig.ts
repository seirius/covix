import * as env from "env-var";
import { config as envConfig } from "dotenv";
import { join } from "path";
envConfig();

export class CovixConfig {
    public static readonly PORT: number = env
        .get("COVIX_PORT")
        .default(3000)
        .asPortNumber();

    public static readonly MONGO_URL: string = env
        .get("COVIX_MONGO_URL")
        .default("mongodb://localhost/covix")
        .asString();

    public static readonly FILE_PATH: string = env
        .get("COVIX_FILE_PATH")
        .default(join(__dirname, "..", "..", "covix-files"))
        .asString();

    public static readonly SOCKET_PORT: number = env
        .get("COVIX_SOCKET_PORT")
        .default(8080)
        .asPortNumber();

    public static readonly SOCKET_PATH: string = env
        .get("COVIX_SOCKET_PATH")
        .default("http://localhost:8080")
        .asString();

    public static readonly CRON_JOIN_ROOM_CURRENT_TIME = env
        .get("COVIX_JOB_TIME_ROOM_CURRENT_TIME")
        .default("*/3 * * * * *")
        .asString();

    public static readonly ROOM_EXPIRE_TIME: number = env
        .get("COVIX_ROOM_EXPIRE_TIME")
        .default(60)
        .asInt();
        
}