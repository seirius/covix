import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "./user.controller";
import { UserGateway } from "./user.gateway";
import { User, UserSchema } from "./user.schema";
import { UserService } from "./user.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: User.name,
                schema: UserSchema
            }
        ]),
    ],
    providers: [UserService, UserGateway],
    exports: [UserService],
    controllers: [UserController]
}) 
export class UserModule {}