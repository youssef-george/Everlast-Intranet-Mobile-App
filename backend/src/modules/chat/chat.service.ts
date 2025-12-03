import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface SendMessageDto {
    content?: string;
    senderId: string;
    receiverId?: string;
    groupId?: string;
    replyToId?: string;
    // TODO: Uncomment after running migration to add forwarded message support
    // forwardedFromId?: string; // ID of the user who originally sent the forwarded message
    // forwardedFromMessageId?: string; // ID of the original message that was forwarded
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
        try {
            console.log('📝 Processing message send request:', {
                senderId: dto.senderId,
                receiverId: dto.receiverId,
                groupId: dto.groupId,
                hasContent: !!dto.content,
            });

            // Validate sender exists
            const sender = await this.prisma.user.findUnique({
                where: { id: dto.senderId },
                select: { id: true, name: true, accountState: true },
            });

            if (!sender) {
                console.error(`❌ Sender not found: ${dto.senderId}`);
                throw new Error(`Sender with ID ${dto.senderId} not found`);
            }

            if (sender.accountState !== 'ACTIVE') {
                console.error(`❌ Sender account is not active: ${dto.senderId}`);
                throw new Error('Your account is not active. Please contact an administrator.');
            }

            // Validate receiver if it's a direct message
            if (dto.receiverId && !dto.groupId) {
                const receiver = await this.prisma.user.findUnique({
                    where: { id: dto.receiverId },
                    select: { id: true, name: true, accountState: true },
                });

                if (!receiver) {
                    console.error(`❌ Receiver not found: ${dto.receiverId}`);
                    throw new Error(`Receiver with ID ${dto.receiverId} not found`);
                }

                if (receiver.accountState !== 'ACTIVE') {
                    console.error(`❌ Receiver account is not active: ${dto.receiverId}`);
                    throw new Error('Cannot send message to an inactive user');
                }

                console.log(`✓ Validated sender (${sender.name}) and receiver (${receiver.name})`);
            }

            // Validate group if it's a group message
            if (dto.groupId) {
                const group = await this.prisma.group.findUnique({
                    where: { id: dto.groupId },
                    include: {
                        members: {
                            where: { userId: dto.senderId },
                        },
                    },
                });

                if (!group) {
                    console.error(`❌ Group not found: ${dto.groupId}`);
                    throw new Error(`Group with ID ${dto.groupId} not found`);
                }

                if (group.members.length === 0) {
                    console.error(`❌ Sender is not a member of group: ${dto.groupId}`);
                    throw new Error('You are not a member of this group');
                }

                console.log(`✓ Validated sender is member of group: ${group.name}`);
            }

            // Validate content or attachments exist
            if (!dto.content?.trim() && !dto.groupId && !dto.receiverId) {
                console.error('❌ Message has no content and no recipient');
                throw new Error('Message must have content or attachments');
            }

            const messageData: any = {
                content: dto.content,
                senderId: dto.senderId,
                receiverId: dto.receiverId,
                groupId: dto.groupId,
                replyToId: dto.replyToId,
            };
            
            // TODO: Forwarded fields are disabled until migration is run
            // Uncomment after running migration to add these columns to database:
            // if (dto.forwardedFromId) {
            //     messageData.forwardedFromId = dto.forwardedFromId;
            // }
            // if (dto.forwardedFromMessageId) {
            //     messageData.forwardedFromMessageId = dto.forwardedFromMessageId;
            // }

            const includeData: any = {
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
            };

            // Only include forwarded relations if columns exist (after migration)
            // Uncomment after running migration:
            // includeData.forwardedFrom = true;
            // includeData.forwardedFromMessage = {
            //     include: {
            //         sender: true,
            //         attachments: true,
            //         voiceNote: true,
            //     },
            // };

            // Create message in database
            const createdMessage = await this.prisma.message.create({
                data: messageData,
                include: includeData,
            });
            
            console.log('💾 Message stored in database successfully:', {
                id: createdMessage.id,
                senderId: createdMessage.senderId,
                receiverId: createdMessage.receiverId,
                groupId: createdMessage.groupId,
                hasContent: !!createdMessage.content,
                attachmentsCount: createdMessage.attachments?.length || 0,
                hasVoiceNote: !!createdMessage.voiceNote,
                createdAt: createdMessage.createdAt,
            });
            
            return createdMessage;
        } catch (error) {
            console.error('❌ Error in sendMessage:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            
            // Re-throw the error so gateway can handle it
            throw error;
        }
    }

    async getMessages(userId: string, otherUserId: string, limit = 1000) {
        try {
            // Allow messages to self (senderId === receiverId)
            const isSelfChat = userId === otherUserId;
            
            console.log(`📥 getMessages: userId=${userId}, otherUserId=${otherUserId}, limit=${limit}, isSelfChat=${isSelfChat}`);
            
            // First, verify both users exist to avoid foreign key errors
            const [user1, user2] = await Promise.all([
                this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
                !isSelfChat ? this.prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } }) : Promise.resolve(null),
            ]);

            if (!user1) {
                console.error(`❌ User ${userId} not found`);
                return [];
            }
            if (!isSelfChat && !user2) {
                console.error(`❌ User ${otherUserId} not found`);
                return [];
            }

            const messages = await this.prisma.message.findMany({
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
                orderBy: { createdAt: 'asc' },
                take: limit,
            });
            
            console.log(`✅ getMessages: Found ${messages.length} messages`);
            return messages;
        } catch (error) {
            console.error('❌ Error in getMessages:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            // Return empty array instead of throwing to prevent 500 errors
            return [];
        }
    }

    async getGroupMessages(groupId: string, limit = 1000) {
        try {
            console.log(`📥 getGroupMessages: groupId=${groupId}, limit=${limit}`);
            
            const messages = await this.prisma.message.findMany({
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
            
            console.log(`✅ getGroupMessages: Found ${messages.length} messages`);
            return messages;
        } catch (error) {
            console.error('❌ Error in getGroupMessages:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            throw error;
        }
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
        try {
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
            try {
                const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
                if (!partnerId) continue;
                
                // Allow self-chat (senderId === receiverId)
                const isSelfChat = msg.senderId === userId && msg.receiverId === userId;
                
                const partner = msg.senderId === userId ? msg.receiver : msg.sender;
                
                // Skip if partner is null (shouldn't happen but safety check)
                if (!partner) continue;
                
                // For self-chat, use sender as partner; otherwise check if partner is active
                // Use optional chaining and default to 'ACTIVE' if accountState is null/undefined
                if (!isSelfChat && partner.accountState && partner.accountState !== 'ACTIVE') continue;

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
            } catch (msgError) {
                console.error('Error processing message in getRecentChats:', msgError, msg);
                continue; // Skip this message and continue with the next one
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
            try {
                if (!membership.group) return null;
                
                const group = membership.group;
                const lastMessage = group.messages?.[0] || null;

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
            } catch (groupError) {
                console.error('Error processing group in getRecentChats:', groupError, membership);
                return null; // Return null for failed groups, filter them out below
            }
        }));

        // Filter out null values from failed group processing
        const validGroupChats = groupChatPreviews.filter(chat => chat !== null);

        const allChats = [...individualChatPreviews, ...validGroupChats];
        console.log(`✅ getRecentChats for userId ${userId}: Found ${allChats.length} chats (${individualChatPreviews.length} individual, ${validGroupChats.length} groups)`);
        return allChats;
        } catch (error) {
            console.error('Error in getRecentChats:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            // Return empty array instead of throwing to prevent 500 errors
            return [];
        }
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
