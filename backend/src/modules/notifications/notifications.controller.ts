import { Controller, Get, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    async getUserNotifications(
        @Query('userId') userId: string,
        @Query('unreadOnly') unreadOnly?: string,
    ) {
        return this.notificationsService.getUserNotifications(
            userId,
            unreadOnly === 'true',
        );
    }

    @Get('unread-count')
    async getUnreadCount(@Query('userId') userId: string) {
        const count = await this.notificationsService.getUnreadCount(userId);
        return { count };
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    async markAllAsRead(@Body('userId') userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }

    @Delete(':id')
    async deleteNotification(@Param('id') id: string) {
        return this.notificationsService.deleteNotification(id);
    }
}

