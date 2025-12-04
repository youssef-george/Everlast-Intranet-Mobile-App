import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { FaUserCircle, FaUsers, FaSearch, FaPlus } from 'react-icons/fa';
import api from '../services/api';
import type { ChatPreview, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';

const Chats: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: chats = [], isLoading } = useQuery({
        queryKey: ['recent-chats', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const response = await api.get<any[]>(`/chat/recent/${currentUser.id}`);
            return response.data.filter((chat: any) => {
                // Filter out chats with deactivated users
                return chat.user && chat.user.accountState === 'ACTIVE';
            });
        },
        enabled: !!currentUser,
        refetchInterval: 10000, // Refetch every 10 seconds
    });

    const filteredChats = chats.filter((chat: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            chat.user.name.toLowerCase().includes(query) ||
            chat.lastMessage?.content?.toLowerCase().includes(query)
        );
    });

    // Sort by last message time
    const sortedChats = [...filteredChats].sort((a: any, b: any) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
        );
    });

    if (isLoading) {
        return <div className="p-4 text-center">Loading chats...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-bg pt-0 md:pt-16">
            <div className="bg-primary p-4 text-white shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">Chats</h1>
                    <button
                        onClick={() => navigate('/members')}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title="New Chat"
                    >
                        <FaPlus />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/90 dark:bg-dark-paper/90 text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading chats...</div>
                ) : sortedChats.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>{searchQuery ? 'No chats found' : 'No chats yet.'}</p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate('/members')}
                                className="mt-4 text-primary font-medium hover:underline"
                            >
                                Start a conversation
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {sortedChats
                            .filter((chat: any) => chat.user) // Filter out chats without user
                            .map((chat: any) => {
                                const otherUser = chat.user;
                                const lastMessage = chat.lastMessage;

                                if (!otherUser) return null;

                                return (
                                    <div
                                        key={otherUser.id}
                                        onClick={() => navigate(`/messages/${otherUser.id}`)}
                                        className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer transition-colors"
                                    >
                                        <div className="relative mr-4">
                                            {(() => {
                                                const profilePictureUrl = getImageUrl(otherUser.profilePicture);
                                                return profilePictureUrl ? (
                                                    <img
                                                        src={profilePictureUrl}
                                                        alt={otherUser.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.nextElementSibling;
                                                            if (fallback) {
                                                                (fallback as HTMLElement).style.display = 'block';
                                                            }
                                                        }}
                                                    />
                                                ) : null;
                                            })()}
                                            <FaUserCircle className="w-12 h-12 text-gray-400" style={{ display: otherUser.profilePicture ? 'none' : 'block' }} />
                                            {otherUser.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-bg"></div>
                                            )}
                                        </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text truncate">
                                                {otherUser.name}
                                            </h3>
                                            {lastMessage && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                                    {isToday(new Date(lastMessage.createdAt))
                                                        ? format(new Date(lastMessage.createdAt), 'h:mm a')
                                                        : format(new Date(lastMessage.createdAt), 'MMM d')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-600 dark:text-dark-muted truncate pr-2">
                                                {lastMessage?.content
                                                    ? lastMessage.content.length > 50
                                                        ? lastMessage.content.substring(0, 50) + '...'
                                                        : lastMessage.content
                                                    : lastMessage?.attachments?.length
                                                    ? 'Sent an attachment'
                                                    : 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                        .filter(Boolean)} {/* Remove any null values */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chats;
