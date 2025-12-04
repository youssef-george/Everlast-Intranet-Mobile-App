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
        origin: true, // Allow all origins for network access and Safari compatibility
        credentials: true,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['websocket', 'polling'], // Support both transports for Safari compatibility
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

    // Helper method to emit message to users (for file uploads)
    async emitMessageToUsers(messageId: string, senderId: string, receiverId: string) {
        try {
            console.log('📤 Emitting message to users:', { messageId, senderId, receiverId });

            // Get full message with all relations
            const fullMessage = await this.prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicture: true,
                            isOnline: true,
                            accountState: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicture: true,
                            isOnline: true,
                            accountState: true,
                        },
                    },
                    group: true,
                    replyTo: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    },
                    attachments: true,
                    voiceNote: true,
                    reactions: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!fullMessage) {
                console.error('❌ Message not found:', messageId);
                return;
            }

            // Emit to receiver
            const receiverSocketId = this.userSockets.get(receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('newMessage', fullMessage);
                console.log('✅ Message emitted to receiver');
                
                // Update unread count
                const unreadCount = await this.prisma.message.count({
                    where: {
                        OR: [
                            { senderId, receiverId },
                            { senderId: receiverId, receiverId: senderId },
                        ],
                        senderId: { not: receiverId },
                        seenAt: null,
                        isDeleted: false,
                    },
                });
                this.server.to(receiverSocketId).emit('unreadCountUpdate', {
                    chatId: senderId,
                    unreadCount,
                });
                this.server.to(receiverSocketId).emit('refreshRecentChats');
            } else {
                console.log('⚠️ Receiver not connected');
            }

            // Emit to sender
            const senderSocketId = this.userSockets.get(senderId);
            if (senderSocketId) {
                this.server.to(senderSocketId).emit('messageSaved', fullMessage);
                console.log('✅ Message save confirmation sent to sender');
            }
        } catch (error) {
            console.error('❌ Error emitting message to users:', error);
        }
    }

    // Helper method to emit message to group (for file uploads)
    async emitMessageToGroup(messageId: string, groupId: string, senderId: string) {
        try {
            console.log('📤 Emitting message to group:', { messageId, groupId, senderId });

            // Get full message with all relations
            const fullMessage = await this.prisma.message.findUnique({
                where: { id: messageId },
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

            if (!fullMessage) {
                console.error('❌ Message not found:', messageId);
                return;
            }

            // Get group members
            const groupMembers = await this.prisma.groupMember.findMany({
                where: { groupId },
            });

            // Emit to all group members
            groupMembers.forEach((member) => {
                const socketId = this.userSockets.get(member.userId);
                if (socketId) {
                    if (member.userId === senderId) {
                        // Send confirmation to sender
                        this.server.to(socketId).emit('messageSaved', fullMessage);
                    } else {
                        // Send new message to other members
                        this.server.to(socketId).emit('newMessage', fullMessage);
                    }
                }
            });

            console.log('✅ Message emitted to group members');
        } catch (error) {
            console.error('❌ Error emitting message to group:', error);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() data: SendMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            console.log('📨 Received sendMessage event:', {
                senderId: data.senderId,
                receiverId: data.receiverId,
                groupId: data.groupId,
                content: data.content?.substring(0, 50),
            });
            
            // Get sender info first for immediate emission
            const sender = await this.prisma.user.findUnique({
                where: { id: data.senderId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true,
                    isOnline: true,
                    accountState: true,
                },
            });

            if (!sender || sender.accountState !== 'ACTIVE') {
                throw new Error('Sender not found or inactive');
            }

            // Save message to database (async, don't block emission)
            const messagePromise = this.chatService.sendMessage(data);
            
            // Emit confirmation to sender immediately with temp data
            const tempMessage = {
                id: `temp-${Date.now()}`,
                content: data.content,
                senderId: data.senderId,
                receiverId: data.receiverId,
                groupId: data.groupId,
                replyToId: data.replyToId,
                sender: sender,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPinned: false,
                isDeleted: false,
                deliveredAt: null,
                seenAt: null,
            };
            
            client.emit('messageSaved', tempMessage);
            console.log('✅ Message confirmation sent to sender immediately');

            // Wait for message to be saved (this is fast - just DB insert)
            const message = await messagePromise;
            console.log('✅ Message saved to database:', message.id);

            // Emit to receiver IMMEDIATELY with basic data (before fetching full relations)
            if (data.receiverId) {
                const receiverSocketId = this.userSockets.get(data.receiverId);
                console.log('📤 Preparing to emit message to receiver:', {
                    receiverId: data.receiverId,
                    receiverSocketId,
                });
                
                // Create notification promise (async, don't block)
                const notificationPromise = data.receiverId !== data.senderId 
                    ? this.notificationsService.createNotification({
                        userId: data.receiverId,
                        type: 'MESSAGE',
                        title: `${sender.name}`,
                        content: data.content || 'Sent an attachment',
                        link: `/chats/${data.senderId}`,
                    }).catch(error => {
                        console.error('Failed to create notification', error);
                        return null;
                    })
                    : Promise.resolve(null);
                
                if (receiverSocketId) {
                    // Emit message IMMEDIATELY with available data (real ID from DB, sender info we already have)
                    const instantMessage = {
                        ...tempMessage,
                        id: message.id, // Use real ID from saved message
                    };
                    
                    console.log(`📡 Sending newMessage event to receiver socket IMMEDIATELY: ${receiverSocketId}`);
                    this.server.to(receiverSocketId).emit('newMessage', instantMessage);
                    console.log('✅ Message emitted to receiver socket immediately:', {
                        receiverId: data.receiverId,
                        messageId: instantMessage.id,
                        content: instantMessage.content?.substring(0, 50),
                    });
                    
                    // Emit notification immediately (don't wait for DB save)
                    if (data.receiverId !== data.senderId) {
                        this.server.to(receiverSocketId).emit('newNotification', {
                            type: 'MESSAGE',
                            title: `${sender.name}`,
                            content: data.content || 'Sent an attachment',
                            link: `/chats/${data.senderId}`,
                        });
                        console.log('✅ Notification event emitted to receiver immediately');
                    }
                    
                    // Calculate and emit unread count in parallel (non-blocking)
                    this.prisma.message.count({
                        where: {
                            OR: [
                                { senderId: data.senderId, receiverId: data.receiverId },
                                { senderId: data.receiverId, receiverId: data.senderId },
                            ],
                            senderId: { not: data.receiverId },
                            seenAt: null,
                            isDeleted: false,
                        },
                    }).then((unreadCount) => {
                        this.server.to(receiverSocketId).emit('unreadCountUpdate', {
                            chatId: data.senderId,
                            unreadCount,
                        });
                        console.log(`📊 Unread count update sent to receiver: ${unreadCount} unread messages`);
                    });
                    
                    // Also emit a refresh event to update the recent chats list
                    this.server.to(receiverSocketId).emit('refreshRecentChats');
                    console.log('🔄 Refresh recent chats event sent to receiver');
                } else {
                    console.log('⚠️ Receiver not connected, message saved to database but not delivered via socket');
                    console.log('   Message will appear when receiver refreshes or reconnects');
                    console.log('   Current connected users:', Array.from(this.userSockets.keys()));
                    // Still create notification even if receiver is offline
                    notificationPromise;
                }
            }

            // Get full message with all relations (in parallel, don't block)
            const fullMessagePromise = this.prisma.message.findUnique({
                where: { id: message.id },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicture: true,
                            isOnline: true,
                            accountState: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicture: true,
                            isOnline: true,
                            accountState: true,
                        },
                    },
                    group: true,
                    replyTo: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    },
                    attachments: true,
                    voiceNote: true,
                    reactions: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    },
                },
            });

            // Continue with full message processing
            const fullMessage = await fullMessagePromise;

            // Update receiver with full message data if they're connected
            if (data.receiverId) {
                const receiverSocketId = this.userSockets.get(data.receiverId);
                if (receiverSocketId) {
                    this.server.to(receiverSocketId).emit('messageUpdated', fullMessage);
                    console.log('✅ Message updated with full data for receiver');
                }
                
                // Update sender with full message data (already sent temp confirmation above)
                client.emit('messageSaved', fullMessage);
                console.log('✅ Message updated with full data for sender');
            } else if (data.groupId) {
                // Get group members and info in parallel
                const [groupMembers, group] = await Promise.all([
                    this.prisma.groupMember.findMany({
                        where: { groupId: data.groupId },
                    }),
                    this.prisma.group.findUnique({
                        where: { id: data.groupId },
                    }),
                ]);

                // Send newMessage and notifications to all group members IMMEDIATELY
                const notificationPromises: Promise<any>[] = [];
                
                groupMembers.forEach((member) => {
                    const socketId = this.userSockets.get(member.userId);
                    
                    // Emit message immediately with basic data (don't wait for fullMessage)
                    if (socketId) {
                        const instantGroupMessage = {
                            ...tempMessage,
                            id: message.id,
                            group: group ? { id: group.id, name: group.name } : null,
                        };
                        this.server.to(socketId).emit('newMessage', instantGroupMessage);
                        console.log(`✅ Message emitted to group member ${member.userId} immediately`);
                    }
                    
                    // Create notification and emit in parallel (except for sender)
                    if (member.userId !== data.senderId) {
                        // Emit notification immediately (don't wait for DB)
                        if (socketId) {
                            this.server.to(socketId).emit('newNotification', {
                                type: 'MESSAGE',
                                title: `${sender.name} in ${group?.name || 'Group'}`,
                                content: data.content || 'Sent an attachment',
                                link: `/groups/${data.groupId}`,
                            });
                            console.log(`✅ Notification event emitted to group member ${member.userId} immediately`);
                        }
                        
                        // Create notification in DB (async, don't block)
                        notificationPromises.push(
                            this.notificationsService.createNotification({
                                userId: member.userId,
                                type: 'MESSAGE',
                                title: `${sender.name} in ${group?.name || 'Group'}`,
                                content: data.content || 'Sent an attachment',
                                link: `/groups/${data.groupId}`,
                            }).catch(error => {
                                console.error(`Failed to create notification for member ${member.userId}:`, error);
                                return null;
                            })
                        );
                    }
                });
                
                // Update all group members with full message data in background
                Promise.resolve(fullMessage).then((fullMsg) => {
                    groupMembers.forEach((member) => {
                        const socketId = this.userSockets.get(member.userId);
                        if (socketId) {
                            this.server.to(socketId).emit('messageUpdated', fullMsg);
                        }
                    });
                    console.log('✅ All group members updated with full message data');
                });
                
                // Wait for all notifications to be created (but don't block message delivery)
                Promise.all(notificationPromises).then(() => {
                    console.log('✅ All group notifications created in database');
                });
                
                // Update sender with full message data (already sent temp confirmation above)
                client.emit('messageSaved', fullMessage);
                console.log('✅ Message updated with full data for sender (group)');
            }

            // Return success response
            console.log('✅ Message flow completed successfully');
            return { success: true, messageId: fullMessage.id, message: fullMessage };
        } catch (error) {
            console.error('❌ Error in handleSendMessage:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            
            // Emit error to sender
            client.emit('messageError', { 
                error: error instanceof Error ? error.message : 'Failed to send message',
                details: 'Message could not be saved or delivered'
            });
            
            return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
        }
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

        // Mark related notifications as read (even if no unread messages, user is viewing the chat)
        try {
            if (data.isGroup) {
                // For groups, mark notifications with group link
                const notificationLink = `/groups/${data.chatId}`;
                const result = await this.notificationsService.markNotificationsAsReadByLink(data.userId, notificationLink);
                console.log(`✅ Marked ${result.count} group notifications as read for user ${data.userId}, group ${data.chatId}`);
            } else {
                // For direct messages, mark notifications with chat link
                // The link format is `/chats/${senderId}` where senderId is the other user's ID
                const notificationLink = `/chats/${data.chatId}`;
                const result = await this.notificationsService.markNotificationsAsReadByLink(data.userId, notificationLink);
                console.log(`✅ Marked ${result.count} chat notifications as read for user ${data.userId}, chat ${data.chatId}`);
                
                // Also mark any MESSAGE type notifications that might have different link formats
                // This handles edge cases where link might be slightly different
                await this.notificationsService.markMessageNotificationsAsRead(data.userId, data.chatId);
            }
            
            // Emit notification count update to the user
            const unreadNotificationCount = await this.notificationsService.getUnreadCount(data.userId);
            const userSocketId = this.userSockets.get(data.userId);
            if (userSocketId) {
                this.server.to(userSocketId).emit('notificationCountUpdate', {
                    count: unreadNotificationCount,
                });
                console.log(`📊 Emitted notification count update: ${unreadNotificationCount} unread notifications`);
            }
        } catch (error) {
            console.error('❌ Failed to mark notifications as read:', error);
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
