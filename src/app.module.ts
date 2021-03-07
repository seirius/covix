import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './sala/room.schema';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "covix-web"),
            exclude: ["/api*"]
        }),
        MongooseModule.forRoot("mongodb://localhost/covix"),
        MongooseModule.forFeature([
            {
                name: Room.name,
                schema: RoomSchema
            }
        ])
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
