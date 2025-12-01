import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ChatService, AddReactionDto } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get('messages/:userId/:otherUserId')
    async getMessages(
        @Param('userId') userId: string,
        @Param('otherUserId') otherUserId: string,
        @Query('limit') limit?: string,
    ) {
        return this.chatService.getMessages(
            userId,
            otherUserId,
            limit ? parseInt(limit) : 50,
        );
    }

    @Get('group/:groupId/messages')
    async getGroupMessages(
        @Param('groupId') groupId: string,
        @Query('limit') limit?: string,
    ) {
        return this.chatService.getGroupMessages(
            groupId,
            limit ? parseInt(limit) : 50,
        );
    }

    @Get('recent/:userId')
    async getRecentChats(@Param('userId') userId: string) {
        return this.chatService.getRecentChats(userId);
    }

    @Get('pinned/:groupId')
    async getPinnedMessages(@Param('groupId') groupId: string) {
        return this.chatService.getPinnedMessages(groupId);
    }

    @Post('reaction')
    async addReaction(@Body() dto: AddReactionDto) {
        return this.chatService.addReaction(dto);
    }

    @Delete('reaction/:messageId/:userId/:emoji')
    async removeReaction(
        @Param('messageId') messageId: string,
        @Param('userId') userId: string,
        @Param('emoji') emoji: string,
    ) {
        return this.chatService.removeReaction(messageId, userId, emoji);
    }

    @Patch('message/:id/pin')
    async pinMessage(
        @Param('id') id: string,
        @Body('isPinned') isPinned: boolean,
    ) {
        return this.chatService.pinMessage(id, isPinned);
    }

    @Delete('message/:id')
    async deleteMessage(
        @Param('id') id: string,
        @Body('userId') userId: string,
        @Body('deleteForEveryone') deleteForEveryone?: boolean,
    ) {
        return this.chatService.deleteMessage(id, userId, deleteForEveryone || false);
    }
}
