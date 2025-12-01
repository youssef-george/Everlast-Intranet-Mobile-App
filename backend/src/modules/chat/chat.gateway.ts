import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService, SendMessageDto, AddReactionDto } from './chat.service';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, string>(); // userId -> socketId

    constructor(
        private chatService: ChatService,
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.userSockets.set(userId, client.id);

            // Update user online status
            await this.prisma.user.update({
                where: { id: userId },
                data: { isOnline: true },
            });

            // Broadcast online status
            this.server.emit('userOnline', { userId, isOnline: true });
            console.log(`✅ User ${userId} connected`);
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = Array.from(this.userSockets.entries()).find(
            ([, socketId]) => socketId === client.id,
        )?.[0];

        if (userId) {
            this.userSockets.delete(userId);

            // Update user offline status
            await this.prisma.user.update({
                where: { id: userId },
                data: { isOnline: false, lastSeen: new Date() },
            });

            // Broadcast offline status
            this.server.emit('userOnline', { userId, isOnline: false });
            console.log(`❌ User ${userId} disconnected`);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() data: SendMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        const message = await this.chatService.sendMessage(data);

        // Get full message with all relations
        const fullMessage = await this.prisma.message.findUnique({
            where: { id: message.id },
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

        // Emit to receiver or group members
        if (data.receiverId) {
            const receiverSocketId = this.userSockets.get(data.receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('newMessage', fullMessage);
                // Emit unread count update to receiver
                const unreadCount = await this.prisma.message.count({
                    where: {
                        OR: [
                            { senderId: data.senderId, receiverId: data.receiverId },
                            { senderId: data.receiverId, receiverId: data.senderId },
                        ],
                        senderId: { not: data.receiverId },
                        seenAt: null,
                        isDeleted: false,
                    },
                });
                this.server.to(receiverSocketId).emit('unreadCountUpdate', {
                    chatId: data.senderId,
                    unreadCount,
                });
            }
            // Also emit to sender so they see their own message
            client.emit('newMessage', fullMessage);

            // Create notification for receiver (if not sending to self)
            if (data.receiverId !== data.senderId) {
                try {
                    await this.notificationsService.createNotification({
                        userId: data.receiverId,
                        type: 'MESSAGE',
                        title: `${fullMessage.sender.name}`,
                        content: fullMessage.content || 'Sent an attachment',
                        link: `/chats/${data.senderId}`,
                    });
                    // Emit notification to receiver
                    if (receiverSocketId) {
                        this.server.to(receiverSocketId).emit('newNotification', {
                            type: 'MESSAGE',
                            title: `${fullMessage.sender.name}`,
                            content: fullMessage.content || 'Sent an attachment',
                        });
                    }
                } catch (error) {
                    console.error('Failed to create notification', error);
                }
            }
        } else if (data.groupId) {
            // Get group members
            const groupMembers = await this.prisma.groupMember.findMany({
                where: { groupId: data.groupId },
            });

            groupMembers.forEach((member) => {
                const socketId = this.userSockets.get(member.userId);
                if (socketId) {
                    this.server.to(socketId).emit('newMessage', fullMessage);
                }
            });

            // Create notifications for group members (except sender)
            const group = await this.prisma.group.findUnique({
                where: { id: data.groupId },
            });

            groupMembers.forEach(async (member) => {
                if (member.userId !== data.senderId) {
                    try {
                        await this.notificationsService.createNotification({
                            userId: member.userId,
                            type: 'MESSAGE',
                            title: `${fullMessage.sender.name} in ${group?.name || 'Group'}`,
                            content: fullMessage.content || 'Sent an attachment',
                            link: `/groups/${data.groupId}`,
                        });
                        const socketId = this.userSockets.get(member.userId);
                        if (socketId) {
                            this.server.to(socketId).emit('newNotification', {
                                type: 'MESSAGE',
                                title: `${fullMessage.sender.name} in ${group?.name || 'Group'}`,
                                content: fullMessage.content || 'Sent an attachment',
                            });
                        }
                    } catch (error) {
                        console.error('Failed to create notification', error);
                    }
                }
            });
        }

        // Send back to sender as confirmation
        client.emit('messageSent', fullMessage);
        return fullMessage;
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @MessageBody() data: { userId: string; chatId: string; isGroup: boolean },
    ) {
        console.log('📝 Typing event received:', data);
        if (data.isGroup) {
            // Broadcast to group members
            const groupMembers = await this.prisma.groupMember.findMany({
                where: { groupId: data.chatId },
            });

            groupMembers.forEach((member) => {
                if (member.userId !== data.userId) {
                    const socketId = this.userSockets.get(member.userId);
                    if (socketId) {
                        console.log(`  → Emitting to group member ${member.userId} (socket: ${socketId})`);
                        this.server.to(socketId).emit('userTyping', data);
                    } else {
                        console.log(`  ⚠️ No socket found for group member ${member.userId}`);
                    }
                }
            });
        } else {
            // Send to individual user (chatId is the other user's ID)
            const socketId = this.userSockets.get(data.chatId);
            if (socketId) {
                console.log(`  → Emitting to user ${data.chatId} (socket: ${socketId})`);
                this.server.to(socketId).emit('userTyping', data);
            } else {
                console.log(`  ⚠️ No socket found for user ${data.chatId}. Available users:`, Array.from(this.userSockets.keys()));
            }
        }
    }

    @SubscribeMessage('stopTyping')
    async handleStopTyping(
        @MessageBody() data: { userId: string; chatId: string; isGroup: boolean },
    ) {
        console.log('🛑 Stop typing event received:', data);
        if (data.isGroup) {
            const groupMembers = await this.prisma.groupMember.findMany({
                where: { groupId: data.chatId },
            });

            groupMembers.forEach((member) => {
                if (member.userId !== data.userId) {
                    const socketId = this.userSockets.get(member.userId);
                    if (socketId) {
                        this.server.to(socketId).emit('userStoppedTyping', data);
                    }
                }
            });
        } else {
            const socketId = this.userSockets.get(data.chatId);
            if (socketId) {
                this.server.to(socketId).emit('userStoppedTyping', data);
            }
        }
    }

    @SubscribeMessage('messageDelivered')
    async handleMessageDelivered(@MessageBody() data: { messageId: string }) {
        const message = await this.chatService.markAsDelivered(data.messageId);

        // Notify sender
        const senderSocketId = this.userSockets.get(message.senderId);
        if (senderSocketId) {
            this.server.to(senderSocketId).emit('messageStatusUpdate', {
                messageId: message.id,
                status: 'delivered',
                deliveredAt: message.deliveredAt,
            });
        }
    }

    @SubscribeMessage('messageSeen')
    async handleMessageSeen(@MessageBody() data: { messageId: string }) {
        const message = await this.chatService.markAsSeen(data.messageId);

        // Notify sender
        const senderSocketId = this.userSockets.get(message.senderId);
        if (senderSocketId) {
            this.server.to(senderSocketId).emit('messageStatusUpdate', {
                messageId: message.id,
                status: 'seen',
                seenAt: message.seenAt,
            });
        }
    }

    @SubscribeMessage('markChatAsRead')
    async handleMarkChatAsRead(
        @MessageBody() data: { chatId: string; userId: string; isGroup: boolean },
    ) {
        // Mark all unread messages in this chat as seen
        const unreadMessages = await this.chatService.getUnreadMessages(
            data.chatId,
            data.userId,
            data.isGroup,
        );

        if (unreadMessages.length > 0) {
            await this.chatService.markChatAsRead(data.chatId, data.userId, data.isGroup);

            // Notify all senders that their messages were seen
            const senderIds = [...new Set(unreadMessages.map((msg) => msg.senderId))];
            senderIds.forEach((senderId) => {
                const senderSocketId = this.userSockets.get(senderId);
                if (senderSocketId) {
                    unreadMessages
                        .filter((msg) => msg.senderId === senderId)
                        .forEach((msg) => {
                            this.server.to(senderSocketId).emit('messageStatusUpdate', {
                                messageId: msg.id,
                                status: 'seen',
                                seenAt: new Date(),
                            });
                        });
                }
            });
        }

        // Emit unread count update to the user who marked as read
        const userSocketId = this.userSockets.get(data.userId);
        if (userSocketId) {
            if (data.isGroup) {
                const unreadCount = await this.prisma.message.count({
                    where: {
                        groupId: data.chatId,
                        senderId: { not: data.userId },
                        seenAt: null,
                        isDeleted: false,
                    },
                });
                this.server.to(userSocketId).emit('unreadCountUpdate', {
                    chatId: data.chatId,
                    unreadCount,
                });
            } else {
                const unreadCount = await this.prisma.message.count({
                    where: {
                        OR: [
                            { senderId: data.chatId, receiverId: data.userId },
                            { senderId: data.userId, receiverId: data.chatId },
                        ],
                        senderId: { not: data.userId },
                        seenAt: null,
                        isDeleted: false,
                    },
                });
                this.server.to(userSocketId).emit('unreadCountUpdate', {
                    chatId: data.chatId,
                    unreadCount,
                });
            }
        }
    }

    @SubscribeMessage('deleteMessage')
    async handleDeleteMessage(
        @MessageBody() data: { messageId: string; userId: string; deleteForEveryone: boolean },
    ) {
        await this.chatService.deleteMessage(data.messageId, data.userId, data.deleteForEveryone);

        if (data.deleteForEveryone) {
            // Broadcast to all participants
            this.server.emit('messageDeleted', { messageId: data.messageId });
        }
    }

    @SubscribeMessage('pinMessage')
    async handlePinMessage(
        @MessageBody() data: { messageId: string; isPinned: boolean; groupId?: string; chatId?: string },
    ) {
        await this.chatService.pinMessage(data.messageId, data.isPinned);

        // Get the message to find participants
        const message = await this.prisma.message.findUnique({
            where: { id: data.messageId },
        });

        if (!message) return;

        if (data.groupId || message.groupId) {
            // Broadcast to group members
            const groupMembers = await this.prisma.groupMember.findMany({
                where: { groupId: data.groupId || message.groupId },
            });

            groupMembers.forEach((member) => {
                const socketId = this.userSockets.get(member.userId);
                if (socketId) {
                    this.server.to(socketId).emit('messagePinned', {
                        messageId: data.messageId,
                        isPinned: data.isPinned,
                    });
                }
            });
        } else if (data.chatId || message.receiverId) {
            // For individual chats, notify both sender and receiver (or self if same)
            const participants = [message.senderId];
            if (message.receiverId && message.receiverId !== message.senderId) {
                participants.push(message.receiverId);
            }

            participants.forEach((userId) => {
                const socketId = this.userSockets.get(userId);
                if (socketId) {
                    this.server.to(socketId).emit('messagePinned', {
                        messageId: data.messageId,
                        isPinned: data.isPinned,
                    });
                }
            });
        }
    }

    @SubscribeMessage('addReaction')
    async handleAddReaction(@MessageBody() data: AddReactionDto) {
        const reaction = await this.chatService.addReaction(data);

        // Get message to find participants
        const message = await this.prisma.message.findUnique({
            where: { id: data.messageId },
            include: { group: { include: { members: true } } },
        });

        if (message.groupId) {
            // Broadcast to group members
            message.group.members.forEach((member) => {
                const socketId = this.userSockets.get(member.userId);
                if (socketId) {
                    this.server.to(socketId).emit('reactionAdded', {
                        messageId: data.messageId,
                        reaction,
                    });
                }
            });
        } else {
            // Send to sender and receiver
            [message.senderId, message.receiverId].forEach((userId) => {
                const socketId = this.userSockets.get(userId);
                if (socketId) {
                    this.server.to(socketId).emit('reactionAdded', {
                        messageId: data.messageId,
                        reaction,
                    });
                }
            });
        }
    }

    @SubscribeMessage('removeReaction')
    async handleRemoveReaction(
        @MessageBody() data: { messageId: string; userId: string; emoji: string },
    ) {
        await this.chatService.removeReaction(data.messageId, data.userId, data.emoji);

        // Broadcast similar to addReaction
        this.server.emit('reactionRemoved', data);
    }
}
