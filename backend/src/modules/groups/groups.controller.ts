import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { GroupsService, CreateGroupDto, UpdateGroupDto } from './groups.service';

@Controller('groups')
export class GroupsController {
    constructor(private groupsService: GroupsService) { }

    @Get()
    async getGroups(@Query('userId') userId?: string) {
        return this.groupsService.getGroups(userId);
    }

    @Get(':id')
    async getGroupById(@Param('id') id: string) {
        return this.groupsService.getGroupById(id);
    }

    @Post()
    async createGroup(@Body() dto: CreateGroupDto) {
        return this.groupsService.createGroup(dto);
    }

    @Patch(':id')
    async updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
        return this.groupsService.updateGroup(id, dto);
    }

    @Post(':id/members')
    async addMember(
        @Param('id') groupId: string,
        @Body('userId') userId: string,
        @Body('requesterId') requesterId: string,
    ) {
        return this.groupsService.addMember(groupId, userId, requesterId);
    }

    @Delete(':id/members/:userId')
    async removeMember(
        @Param('id') groupId: string,
        @Param('userId') userId: string,
        @Body('requesterId') requesterId: string,
    ) {
        return this.groupsService.removeMember(groupId, userId, requesterId);
    }

    @Post(':id/leave')
    async leaveGroup(
        @Param('id') groupId: string,
        @Body('userId') userId: string,
    ) {
        return this.groupsService.leaveGroup(groupId, userId);
    }

    @Delete(':id')
    async deleteGroup(
        @Param('id') id: string,
        @Body('requesterId') requesterId: string,
    ) {
        return this.groupsService.deleteGroup(id, requesterId);
    }
}
