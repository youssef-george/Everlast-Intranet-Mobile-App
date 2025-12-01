import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    async getAllUsers(@Query('includeDeactivated') includeDeactivated?: string) {
        return this.usersService.getAllUsers(includeDeactivated === 'true');
    }

    @Get('search')
    async searchUsers(@Query('q') query: string) {
        return this.usersService.searchUsers(query);
    }

    @Get('global-search')
    async globalSearch(@Query('q') query: string, @Query('userId') userId: string) {
        return this.usersService.globalSearch(query, userId);
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        return this.usersService.getUserById(id);
    }

    @Post()
    async createUser(@Body() dto: CreateUserDto & { requesterId?: string }) {
        return this.usersService.createUser(dto, dto.requesterId);
    }

    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.updateUser(id, dto);
    }

    @Patch(':id/deactivate')
    async deactivateUser(@Param('id') id: string) {
        return this.usersService.deactivateUser(id);
    }

    @Patch(':id/activate')
    async activateUser(@Param('id') id: string) {
        return this.usersService.activateUser(id);
    }

    @Patch(':id/online-status')
    async updateOnlineStatus(
        @Param('id') id: string,
        @Body('isOnline') isOnline: boolean,
    ) {
        return this.usersService.updateOnlineStatus(id, isOnline);
    }
}
