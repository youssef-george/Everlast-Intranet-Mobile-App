import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { FaUserCircle, FaUsers, FaSearch } from 'react-icons/fa';
import api from '../services/api';
import type { ChatPreview, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatWindow from './ChatWindow';

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const { currentUser } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>(id);

    const { data: chats = [], isLoading } = useQuery({
        queryKey: ['recent-chats', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const response = await api.get<ChatPreview[]>(`/chat/recent/${currentUser.id}`);
            return response.data.filter((chat: ChatPreview) => {
                if (!chat.isGroup && chat.user && chat.user.accountState === 'DEACTIVATED') {
                    return false;
                }
                return true;
            });
        },
        enabled: !!currentUser,
        refetchInterval: 10000,
    });

    const filteredChats = chats.filter((chat: ChatPreview) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const chatName = chat.isGroup ? chat.name : chat.user?.name || '';
        return (
            chatName.toLowerCase().includes(query) ||
            chat.lastMessage?.content?.toLowerCase().includes(query)
        );
    });

    const sortedChats = [...filteredChats].sort((a: ChatPreview, b: ChatPreview) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
        );
    });

    // Listen for real-time updates
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleNewMessage = (message: Message) => {
            // Update the chats list when a new message arrives
            queryClient.setQueryData(['recent-chats', currentUser.id], (old: ChatPreview[] = []) => {
                const chatId = message.groupId || (message.senderId === currentUser.id ? message.receiverId : message.senderId);
                if (!chatId) return old;

                const existingChatIndex = old.findIndex((chat) => chat.id === chatId);
                
                // If chat is not currently selected, increment unread count
                const shouldIncrementUnread = selectedChatId !== chatId && message.senderId !== currentUser.id;

                if (existingChatIndex >= 0) {
                    const updatedChats = [...old];
                    const existingChat = updatedChats[existingChatIndex];
                    updatedChats[existingChatIndex] = {
                        ...existingChat,
                        lastMessage: {
                            id: message.id,
                            content: message.content || '',
                            createdAt: message.createdAt,
                            sender: message.sender,
                            attachments: message.attachments,
                            voiceNote: message.voiceNote,
                        },
                        unreadCount: shouldIncrementUnread 
                            ? (existingChat.unreadCount || 0) + 1 
                            : existingChat.unreadCount || 0,
                    };
                    return updatedChats;
                } else {
                    // New chat - add it to the list
                    return [
                        {
                            id: chatId,
                            name: message.group?.name || message.sender?.name || 'Unknown',
                            picture: message.group?.picture || message.sender?.profilePicture,
                            isOnline: message.sender?.isOnline || false,
                            user: message.sender,
                            lastMessage: {
                                id: message.id,
                                content: message.content || '',
                                createdAt: message.createdAt,
                                sender: message.sender,
                                attachments: message.attachments,
                                voiceNote: message.voiceNote,
                            },
                            unreadCount: shouldIncrementUnread ? 1 : 0,
                            isGroup: !!message.groupId,
                        },
                        ...old,
                    ];
                }
            });
        };

        const handleUnreadCountUpdate = (data: { chatId: string; unreadCount: number }) => {
            queryClient.setQueryData(['recent-chats', currentUser.id], (old: ChatPreview[] = []) => {
                return old.map((chat) => 
                    chat.id === data.chatId 
                        ? { ...chat, unreadCount: data.unreadCount }
                        : chat
                );
            });
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('unreadCountUpdate', handleUnreadCountUpdate);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('unreadCountUpdate', handleUnreadCountUpdate);
        };
    }, [socket, currentUser, queryClient, selectedChatId]);

    const handleChatSelect = (chatId: string, isGroup: boolean) => {
        setSelectedChatId(chatId);
        
        // Mark chat as read when selecting it
        if (socket && currentUser) {
            socket.emit('markChatAsRead', {
                chatId,
                userId: currentUser.id,
                isGroup,
            });
            
            // Update local unread count to 0
            queryClient.setQueryData(['recent-chats', currentUser.id], (old: ChatPreview[] = []) => {
                return old.map((chat) => 
                    chat.id === chatId 
                        ? { ...chat, unreadCount: 0 }
                        : chat
                );
            });
        }
        
        // On mobile, navigate to full-screen chat
        if (window.innerWidth < 768) {
            navigate(isGroup ? `/groups/${chatId}` : `/chats/${chatId}`);
        }
    };

    const formatTime = (date: Date) => {
        if (isToday(date)) {
            return format(date, 'h:mm a');
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM d');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#f5f5f5]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005d99] mx-auto mb-4"></div>
                    <p className="text-[#6b7280]">Loading chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-[#f5f5f5]">
            {/* Left Panel - Conversations List */}
            <div className="w-full md:w-[360px] border-r border-[#e5e5e5] flex flex-col bg-white">
                {/* Search Header */}
                <div className="p-4 border-b border-[#e5e5e5]">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 rounded-lg border border-[#e5e5e5] px-4 text-sm bg-[#f5f5f5] focus:outline-none focus:border-[#005d99] focus:bg-white transition-colors"
                    />
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {sortedChats.length === 0 ? (
                        <div className="p-8 text-center text-[#6b7280]">
                            <p>No conversations yet.</p>
                            <button
                                onClick={() => navigate('/members')}
                                className="mt-4 text-[#005d99] font-medium hover:underline"
                            >
                                Start a conversation
                            </button>
                        </div>
                    ) : (
                        <div>
                            {sortedChats.map((chat: ChatPreview) => {
                                const chatPartner = chat.isGroup ? chat : chat.user;
                                if (!chatPartner) return null;

                                const isActive = selectedChatId === chat.id;
                                const lastMessageDate = chat.lastMessage ? new Date(chat.lastMessage.createdAt) : null;

                                return (
                                    <div
                                        key={chat.id}
                                        onClick={() => handleChatSelect(chat.id, chat.isGroup)}
                                        className={`flex items-center gap-3 px-4 py-3 border-b border-[#f3f4f6] cursor-pointer transition-colors ${
                                            isActive
                                                ? 'bg-[#e3f2fd]'
                                                : 'hover:bg-[#f9fafb]'
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            {chatPartner.picture || chatPartner.profilePicture ? (
                                                <img
                                                    src={chatPartner.picture || chatPartner.profilePicture}
                                                    alt={chatPartner.name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-sm">
                                                    {getInitials(chatPartner.name)}
                                                </div>
                                            )}
                                            {chat.isOnline && !chat.isGroup && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#17a74a] rounded-full border-2 border-white"></div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="text-[15px] font-semibold text-[#1f2937] truncate">
                                                    {chat.name}
                                                </h3>
                                                {lastMessageDate && (
                                                    <span className="text-[11px] text-[#9ca3af] ml-2 flex-shrink-0">
                                                        {formatTime(lastMessageDate)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-[13px] text-[#6b7280] truncate">
                                                    {chat.lastMessage?.content
                                                        ? chat.lastMessage.content.length > 40
                                                            ? chat.lastMessage.content.substring(0, 40) + '...'
                                                            : chat.lastMessage.content
                                                        : chat.lastMessage?.attachments?.length
                                                        ? '📎 Attachment'
                                                        : chat.lastMessage?.voiceNote
                                                        ? '🎙️ Voice Note'
                                                        : 'No messages yet'}
                                                </p>
                                                {chat.unreadCount > 0 && (
                                                    <span className="bg-[#005d99] text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-[10px] ml-2 flex-shrink-0">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Chat Window (Desktop Only) */}
            <div className="hidden md:flex flex-1 bg-[#f0f2f5]">
                {selectedChatId ? (
                    <div className="w-full h-full">
                        <ChatWindow chatId={selectedChatId} isGroup={sortedChats.find(c => c.id === selectedChatId)?.isGroup || false} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-center p-8">
                        <div>
                            <div className="text-6xl mb-4">💭</div>
                            <h2 className="text-xl font-semibold text-[#1f2937] mb-2">
                                Select a conversation
                            </h2>
                            <p className="text-[#6b7280]">
                                Choose a conversation from the list to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;

