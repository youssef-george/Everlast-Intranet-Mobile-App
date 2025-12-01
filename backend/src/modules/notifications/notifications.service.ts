import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface CreateNotificationDto {
    userId: string;
    type: 'MESSAGE' | 'REPLY' | 'MENTION' | 'GROUP_ADD' | 'GROUP_REMOVE' | 'SYSTEM';
    title: string;
    content: string;
    link?: string;
}

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async createNotification(dto: CreateNotificationDto) {
        return this.prisma.notification.create({
            data: {
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                content: dto.content,
                link: dto.link,
            },
        });
    }

    async getUserNotifications(userId: string, unreadOnly = false) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { isRead: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async markAsRead(notificationId: string) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async deleteNotification(notificationId: string) {
        return this.prisma.notification.delete({
            where: { id: notificationId },
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
}

