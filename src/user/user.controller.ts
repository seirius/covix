import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { UserGateway } from "./user.gateway";
import { SaveUser, UpdateUserClientID, userAsResponse, UserResponse, UserService } from "./user.service";

@Controller("api/user")
export class UserController {

    constructor(
        private readonly userService: UserService,
        private readonly userGateway: UserGateway
    ) {}

    @Post("")
    public async saveUser(@Body() body: SaveUser): Promise<UserResponse> {
        const user = await this.userService.saveUser(body);
        this.userGateway.newUser(user.username);
        return userAsResponse(user);
    }

    @Get("")
    public async getUser(@Query("username") username: string): Promise<UserResponse> {
        const user = await this.userService.userModel.findOne({ username });
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return userAsResponse(user);
    }

    @Put(":username/client-id")
    public async clientId(
        @Param("username") username: string,
        @Body() body: UpdateUserClientID
    ): Promise<void> {
        const user = await this.userService.userModel.findOne({ username });
        if (!user) {
            throw new NotFoundException("User not found");
        }
        user.clientId = body.clientId;
        await user.save();
        this.userGateway.userJoined(user.username);
    }

    @Get("free")
    public async getFreeUsers(): Promise<UserResponse[]> {
        const users = await this.userService.userModel.find({
            $or: [
                { clientId: null },
                { clientId: undefined },
            ]
        });
        return users.map(userAsResponse);
    }

    @Delete(":username")
    public async deleteUser(@Param("username") username: string): Promise<void> {
        const user = await this.userService.userModel.findOne({ username });
        if (!user) {
            throw new NotFoundException("User not found");
        }
        await user.delete();
        this.userGateway.deleteUser(username);
    }

}