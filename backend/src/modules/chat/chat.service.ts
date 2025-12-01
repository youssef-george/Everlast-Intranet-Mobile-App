import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface SendMessageDto {
    content?: string;
    senderId: string;
    receiverId?: string;
    groupId?: string;
    replyToId?: string;
}

export interface AddReactionDto {
    messageId: string;
    userId: string;
    emoji: string;
}

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async sendMessage(dto: SendMessageDto) {
        return this.prisma.message.create({
            data: {
                content: dto.content,
                senderId: dto.senderId,
                receiverId: dto.receiverId,
                groupId: dto.groupId,
                replyToId: dto.replyToId,
            },
            include: {
                sender: true,
                receiver: true,
                group: true,
                replyTo: {
                    include: {
                        sender: true,
                    },
                },
                attachments: true,
                voiceNote: true,
                reactions: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async getMessages(userId: string, otherUserId: string, limit = 50) {
        // Allow messages to self (senderId === receiverId)
        const isSelfChat = userId === otherUserId;
        
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                    // Allow self-messages
                    ...(isSelfChat ? [{ senderId: userId, receiverId: userId }] : []),
                ],
                isDeleted: false,
            },
            include: {
                sender: true,
                receiver: true,
                replyTo: {
                    include: {
                        sender: true,
                    },
                },
                attachments: true,
                voiceNote: true,
                reactions: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    async getGroupMessages(groupId: string, limit = 50) {
        return this.prisma.message.findMany({
            where: {
                groupId,
                isDeleted: false,
            },
            include: {
                sender: true,
                replyTo: {
                    include: {
                        sender: true,
                    },
                },
                attachments: true,
                voiceNote: true,
                reactions: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    async deleteMessage(messageId: string, userId: string, deleteForEveryone = false) {
        if (deleteForEveryone) {
            return this.prisma.message.update({
                where: { id: messageId },
                data: { isDeleted: true },
            });
        } else {
            const message = await this.prisma.message.findUnique({
                where: { id: messageId },
            });

            const deletedFor = message.deletedFor ? JSON.parse(message.deletedFor) : [];
            deletedFor.push(userId);

            return this.prisma.message.update({
                where: { id: messageId },
                data: { deletedFor: JSON.stringify(deletedFor) },
            });
        }
    }

    async pinMessage(messageId: string, isPinned: boolean) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { isPinned },
        });
    }

    async addReaction(dto: AddReactionDto) {
        return this.prisma.reaction.upsert({
            where: {
                messageId_userId_emoji: {
                    messageId: dto.messageId,
                    userId: dto.userId,
                    emoji: dto.emoji,
                },
            },
            create: dto,
            update: {},
            include: {
                user: true,
            },
        });
    }

    async removeReaction(messageId: string, userId: string, emoji: string) {
        return this.prisma.reaction.delete({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji,
                },
            },
        });
    }

    async markAsDelivered(messageId: string) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { deliveredAt: new Date() },
        });
    }

    async markAsSeen(messageId: string) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { seenAt: new Date() },
        });
    }

    async markChatAsRead(chatId: string, userId: string, isGroup: boolean) {
        if (isGroup) {
            // Mark all unread messages in group as seen
            return this.prisma.message.updateMany({
                where: {
                    groupId: chatId,
                    senderId: { not: userId },
                    seenAt: null,
                    isDeleted: false,
                },
                data: { seenAt: new Date() },
            });
        } else {
            // Mark all unread messages in individual chat as seen
            return this.prisma.message.updateMany({
                where: {
                    OR: [
                        { senderId: chatId, receiverId: userId },
                        { senderId: userId, receiverId: chatId },
                    ],
                    senderId: { not: userId },
                    seenAt: null,
                    isDeleted: false,
                },
                data: { seenAt: new Date() },
            });
        }
    }

    async getUnreadMessages(chatId: string, userId: string, isGroup: boolean) {
        if (isGroup) {
            return this.prisma.message.findMany({
                where: {
                    groupId: chatId,
                    senderId: { not: userId },
                    seenAt: null,
                    isDeleted: false,
                },
            });
        } else {
            return this.prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: chatId, receiverId: userId },
                        { senderId: userId, receiverId: chatId },
                    ],
                    senderId: { not: userId },
                    seenAt: null,
                    isDeleted: false,
                },
            });
        }
    }

    async getRecentChats(userId: string) {
        // Get individual chats - only with active users
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
                groupId: null,
                isDeleted: false,
            },
            include: {
                sender: true,
                receiver: true,
                attachments: true,
                voiceNote: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Group by conversation partner and filter active users
        const chatsMap = new Map();
        for (const msg of messages) {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!partnerId) continue;
            
            // Allow self-chat (senderId === receiverId)
            const isSelfChat = msg.senderId === userId && msg.receiverId === userId;
            
            const partner = msg.senderId === userId ? msg.receiver : msg.sender;
            // For self-chat, use sender as partner; otherwise check if partner is active
            if (!isSelfChat && (!partner || partner.accountState !== 'ACTIVE')) continue;

            // Only add if we haven't seen this partner, or if this message is newer
            if (!chatsMap.has(partnerId)) {
                chatsMap.set(partnerId, {
                    id: partnerId,
                    name: partner.name,
                    picture: partner.profilePicture,
                    isOnline: partner.isOnline,
                    user: partner, // Include full user object for compatibility
                    lastMessage: {
                        id: msg.id,
                        content: msg.content,
                        createdAt: msg.createdAt,
                        sender: msg.sender,
                        attachments: msg.attachments,
                        voiceNote: msg.voiceNote,
                    },
                    unreadCount: 0, // Will be calculated below
                    isGroup: false,
                });
            } else {
                // Update with newer message if this one is more recent
                const existingChat = chatsMap.get(partnerId);
                const existingDate = new Date(existingChat.lastMessage.createdAt);
                const newDate = new Date(msg.createdAt);
                if (newDate > existingDate) {
                    chatsMap.set(partnerId, {
                        ...existingChat,
                        lastMessage: {
                            id: msg.id,
                            content: msg.content,
                            createdAt: msg.createdAt,
                            sender: msg.sender,
                            attachments: msg.attachments,
                            voiceNote: msg.voiceNote,
                        },
                    });
                }
            }
        }

        // Calculate unread counts for all chats in parallel
        const unreadCountPromises = Array.from(chatsMap.keys()).map(async (partnerId) => {
            const unreadCount = await this.prisma.message.count({
                where: {
                    OR: [
                        { senderId: partnerId, receiverId: userId },
                        { senderId: userId, receiverId: partnerId },
                    ],
                    senderId: { not: userId },
                    seenAt: null,
                    isDeleted: false,
                },
            });
            return { partnerId, unreadCount };
        });

        const unreadCounts = await Promise.all(unreadCountPromises);
        
        // Update chats with unread counts
        unreadCounts.forEach(({ partnerId, unreadCount }) => {
            const chat = chatsMap.get(partnerId);
            if (chat) {
                chat.unreadCount = unreadCount;
            }
        });

        const individualChatPreviews = Array.from(chatsMap.values());

        // Get group chats
        const groupMemberships = await this.prisma.groupMember.findMany({
            where: { userId },
            include: {
                group: {
                    include: {
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            where: {
                                isDeleted: false,
                            },
                            include: {
                                sender: true,
                                attachments: true,
                                voiceNote: true,
                            },
                        },
                    },
                },
            },
        });

        const groupChatPreviews = await Promise.all(groupMemberships.map(async (membership) => {
            const group = membership.group;
            const lastMessage = group.messages[0] || null;

            const unreadCount = await this.prisma.message.count({
                where: {
                    groupId: group.id,
                    senderId: { not: userId },
                    seenAt: null,
                    isDeleted: false,
                },
            });

            return {
                id: group.id,
                name: group.name,
                picture: group.picture,
                lastMessage,
                unreadCount,
                isGroup: true,
            };
        }));

        return [...individualChatPreviews, ...groupChatPreviews];
    }

    async getPinnedMessages(groupId: string) {
        return this.prisma.message.findMany({
            where: {
                groupId,
                isPinned: true,
                isDeleted: false,
            },
            include: {
                sender: true,
                replyTo: {
                    include: {
                        sender: true,
                    },
                },
                attachments: true,
                voiceNote: true,
                reactions: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
