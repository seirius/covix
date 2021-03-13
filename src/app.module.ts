import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CovixConfig } from './config/CovixConfig';
import { RoomModule } from './room/room.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "covix-web"),
            exclude: ["/api*"]
        }),
        MongooseModule.forRoot(CovixConfig.MONGO_URL),
        RoomModule
    ],
    controllers: [AppController],
    providers: [
        AppService
    ],
})
export class AppModule { }
