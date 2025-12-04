import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';
import { useSocketSafe } from './SocketContext';

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    requestPermission: () => Promise<NotificationPermission>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const { socket } = useSocketSafe(); // Safe version that won't throw
    const queryClient = useQueryClient();
    const [permission, setPermission] = useState<NotificationPermission>('default');

    // Request permission function (memoized)
    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (!('Notification' in window)) {
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            setPermission('granted');
            return 'granted';
        }

        if (Notification.permission === 'denied') {
            setPermission('denied');
            return 'denied';
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    }, []);

    // Check and automatically request notification permission on mount and when user logs in
    useEffect(() => {
        if ('Notification' in window && currentUser) {
            const currentPermission = Notification.permission;
            setPermission(currentPermission);
            
            // Automatically request permission if not already granted or denied
            if (currentPermission === 'default') {
                // Small delay to ensure user sees the app first
                setTimeout(() => {
                    requestPermission().catch(console.error);
                }, 1000);
            } else if (currentPermission === 'granted') {
                // Ensure permission state is updated
                setPermission('granted');
            }
        }
    }, [currentUser, requestPermission]);

    // Fetch notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            try {
                const response = await api.get<Notification[]>(`/notifications?userId=${currentUser.id}`);
                console.log('📬 Fetched notifications:', response.data?.length || 0);
                return response.data || [];
            } catch (error: any) {
                // Handle 404 gracefully - notifications endpoint might not exist
                if (error.response?.status === 404) {
                    console.warn('⚠️ Notifications endpoint not found (404)');
                    return [];
                }
                console.error('❌ Error fetching notifications:', error);
                return [];
            }
        },
        enabled: !!currentUser,
        refetchInterval: 30000, // Refetch every 30 seconds
        retry: 1, // Only retry once on failure
    });

    // Get unread count
    const { data: unreadData } = useQuery({
        queryKey: ['notifications-unread', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return { count: 0 };
            try {
                const response = await api.get<{ count: number }>(`/notifications/unread-count?userId=${currentUser.id}`);
                console.log('🔔 Unread count:', response.data?.count || 0);
                return response.data || { count: 0 };
            } catch (error: any) {
                // Handle 404 gracefully - notifications endpoint might not exist
                if (error.response?.status === 404) {
                    console.warn('⚠️ Unread count endpoint not found (404)');
                    return { count: 0 };
                }
                console.error('❌ Error fetching unread count:', error);
                return { count: 0 };
            }
        },
        enabled: !!currentUser,
        refetchInterval: 30000,
        retry: 1, // Only retry once on failure
    });

    const unreadCount = unreadData?.count || 0;

    // Global message listener - works from any page
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleNewMessage = (message: any) => {
            console.log('📨 Global newMessage received:', {
                messageId: message.id,
                senderId: message.senderId,
                receiverId: message.receiverId,
                groupId: message.groupId,
                currentUserId: currentUser.id,
            });

            // Skip if this is our own message (already handled by messageSaved)
            if (message.senderId === currentUser.id && !message.groupId) {
                return;
            }

            // Determine chat ID
            const chatId = message.groupId || (message.senderId === currentUser.id ? message.receiverId : message.senderId);
            const isGroup = !!message.groupId;

            // Check if this message is for us
            const isForUs = message.groupId 
                ? true // Group messages - assume we're a member if we receive it
                : (message.receiverId === currentUser.id || message.senderId === currentUser.id);

            if (!isForUs || !chatId) {
                return;
            }

            // Check if we're currently viewing this chat (use window.location to avoid Router dependency)
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            const isViewingChat = currentPath.includes(`/messages/${chatId}`) || 
                                 currentPath.includes(`/chats/${chatId}`) ||
                                 currentPath.includes(`/groups/${chatId}`);

            // Update recent chats list globally
            queryClient.setQueryData(['recent-chats', currentUser.id], (old: any[] = []) => {
                const existingChatIndex = old.findIndex(chat => chat.id === chatId);
                
                if (existingChatIndex >= 0) {
                    // Update existing chat
                    const updatedChats = [...old];
                    updatedChats[existingChatIndex] = {
                        ...updatedChats[existingChatIndex],
                        lastMessage: {
                            id: message.id,
                            content: message.content || '',
                            createdAt: message.createdAt,
                            updatedAt: message.updatedAt || message.createdAt,
                            sender: message.sender,
                            senderId: message.senderId,
                            attachments: message.attachments,
                            voiceNote: message.voiceNote,
                            isPinned: message.isPinned || false,
                            isDeleted: message.isDeleted || false,
                        },
                        // Increment unread count if message is not from us and we're not viewing this chat
                        unreadCount: (message.senderId !== currentUser.id && !isViewingChat)
                            ? (updatedChats[existingChatIndex].unreadCount || 0) + 1
                            : updatedChats[existingChatIndex].unreadCount || 0,
                    };
                    // Sort by last message time
                    return updatedChats.sort((a, b) => {
                        if (!a.lastMessage && !b.lastMessage) return 0;
                        if (!a.lastMessage) return 1;
                        if (!b.lastMessage) return -1;
                        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
                    });
                } else {
                    // New chat - add it to the list
                    const chatPartner = message.senderId === currentUser.id 
                        ? message.receiver 
                        : message.sender;
                    
                    return [
                        {
                            id: chatId,
                            name: chatPartner?.name || message.group?.name || 'Unknown',
                            picture: chatPartner?.profilePicture,
                            isOnline: chatPartner?.isOnline || false,
                            user: chatPartner,
                            lastMessage: {
                                id: message.id,
                                content: message.content || '',
                                createdAt: message.createdAt,
                                updatedAt: message.updatedAt || message.createdAt,
                                sender: message.sender,
                                senderId: message.senderId,
                                attachments: message.attachments,
                                voiceNote: message.voiceNote,
                                isPinned: message.isPinned || false,
                                isDeleted: message.isDeleted || false,
                            },
                            unreadCount: (message.senderId !== currentUser.id && !isViewingChat) ? 1 : 0,
                            isGroup: !!message.groupId,
                        },
                        ...old,
                    ];
                }
            });
        };

        const handleUnreadCountUpdate = (data: { chatId: string; unreadCount: number }) => {
            console.log('📊 Global unreadCountUpdate received:', data);
            queryClient.setQueryData(['recent-chats', currentUser.id], (old: any[] = []) => {
                return old.map((chat) => 
                    chat.id === data.chatId 
                        ? { ...chat, unreadCount: data.unreadCount }
                        : chat
                );
            });
        };

        const handleRefreshRecentChats = () => {
            console.log('🔄 Global refreshRecentChats received');
            queryClient.invalidateQueries({ queryKey: ['recent-chats', currentUser.id] });
        };

        // Listen for real-time notifications
        const handleNewNotification = (data: { type: string; title: string; content: string; link?: string }) => {
            console.log('🔔 Received newNotification event:', data);
            
            // Check if Notification API is available
            if (!('Notification' in window)) {
                console.warn('⚠️ Notification API not available in this browser');
                // Still refetch notifications even if browser notifications aren't supported
                queryClient.refetchQueries({ queryKey: ['notifications-unread', currentUser?.id] });
                queryClient.refetchQueries({ queryKey: ['notifications', currentUser?.id] });
                return;
            }
            
            // Check if user is viewing the chat this notification is for
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            const notificationLink = data.link || '';
            
            // Extract chat ID from notification link (format: /chats/:id or /groups/:id)
            let chatIdFromLink = '';
            if (notificationLink.includes('/chats/')) {
                chatIdFromLink = notificationLink.split('/chats/')[1]?.split('/')[0] || '';
            } else if (notificationLink.includes('/groups/')) {
                chatIdFromLink = notificationLink.split('/groups/')[1]?.split('/')[0] || '';
            }
            
            // Check if we're currently viewing this chat
            const isViewingThisChat = chatIdFromLink && (
                currentPath.includes(`/messages/${chatIdFromLink}`) ||
                currentPath.includes(`/chats/${chatIdFromLink}`) ||
                currentPath.includes(`/groups/${chatIdFromLink}`)
            );
            
            if (isViewingThisChat) {
                console.log('📱 User is viewing this chat, skipping browser notification');
                // Still refetch to update the notification list
                queryClient.refetchQueries({ queryKey: ['notifications-unread', currentUser?.id] });
                queryClient.refetchQueries({ queryKey: ['notifications', currentUser?.id] });
                return;
            }
            
            // Check permission again in case it changed
            const currentPermission = Notification.permission;
            console.log('📋 Current notification permission:', currentPermission);
            
            // Show browser notification if permission granted
            if (currentPermission === 'granted') {
                try {
                    const notification = new Notification(data.title, {
                        body: data.content,
                        icon: '/icon.png',
                        badge: '/icon.png',
                        tag: 'everlast-notification',
                        requireInteraction: false,
                        silent: false,
                    });
                    console.log('✅ Browser notification created and shown');
                    
                    // Auto-close notification after 5 seconds
                    setTimeout(() => {
                        notification.close();
                    }, 5000);
                    
                    // Handle notification click - navigate to chat and focus window
                    notification.onclick = () => {
                        console.log('🔔 Notification clicked, navigating to:', notificationLink);
                        if (notificationLink && typeof window !== 'undefined') {
                            window.location.href = notificationLink;
                        }
                        window.focus();
                        notification.close();
                    };
                    
                    // Handle notification error
                    notification.onerror = (error) => {
                        console.error('❌ Notification error:', error);
                    };
                } catch (error) {
                    console.error('❌ Failed to create/show notification:', error);
                    console.error('Error details:', error instanceof Error ? error.stack : String(error));
                }
            } else if (currentPermission === 'default') {
                console.log('⚠️ Notification permission is default, requesting...');
                // Try to request permission again if it's still default
                Notification.requestPermission().then((result) => {
                    console.log('📋 Permission request result:', result);
                    setPermission(result);
                    // If granted, show the notification
                    if (result === 'granted') {
                        try {
                            const notification = new Notification(data.title, {
                                body: data.content,
                                icon: '/icon.png',
                                badge: '/icon.png',
                                tag: 'everlast-notification',
                            });
                            console.log('✅ Browser notification shown after permission grant');
                            
                            setTimeout(() => {
                                notification.close();
                            }, 5000);
                            
                            notification.onclick = () => {
                                window.focus();
                                notification.close();
                            };
                        } catch (error) {
                            console.error('❌ Failed to show notification after permission grant:', error);
                        }
                    } else {
                        console.log('⚠️ User denied notification permission');
                    }
                }).catch((error) => {
                    console.error('❌ Error requesting notification permission:', error);
                });
            } else {
                console.log('⚠️ Notification permission denied, cannot show browser notification');
                console.log('💡 User needs to enable notifications in browser settings');
            }

            // Immediately refetch notifications and count (don't wait for polling)
            console.log('🔄 Refetching notification queries immediately');
            queryClient.refetchQueries({ queryKey: ['notifications-unread', currentUser?.id] });
            queryClient.refetchQueries({ queryKey: ['notifications', currentUser?.id] });
        };

        const handleNotificationCountUpdate = (data: { count: number }) => {
            console.log('🔔 Received notificationCountUpdate event:', data);
            // Immediately refetch to get updated count
            queryClient.refetchQueries({ queryKey: ['notifications-unread', currentUser?.id] });
            queryClient.refetchQueries({ queryKey: ['notifications', currentUser?.id] });
        };

        // Register all global listeners
        socket.on('newMessage', handleNewMessage);
        socket.on('unreadCountUpdate', handleUnreadCountUpdate);
        socket.on('refreshRecentChats', handleRefreshRecentChats);
        socket.on('newNotification', handleNewNotification);
        socket.on('notificationCountUpdate', handleNotificationCountUpdate);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('unreadCountUpdate', handleUnreadCountUpdate);
            socket.off('refreshRecentChats', handleRefreshRecentChats);
            socket.off('newNotification', handleNewNotification);
            socket.off('notificationCountUpdate', handleNotificationCountUpdate);
        };
    }, [socket, permission, currentUser, queryClient]);

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread', currentUser?.id] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser) return;
            await api.patch('/notifications/read-all', { userId: currentUser.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread', currentUser?.id] });
        },
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/notifications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread', currentUser?.id] });
        },
    });

    const markAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    const markAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const deleteNotification = (id: string) => {
        deleteNotificationMutation.mutate(id);
    };

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                requestPermission,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
};

// Safe version that returns default values if provider is not available
export const useNotificationsSafe = () => {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        // Return safe defaults instead of throwing
        return {
            notifications: [],
            unreadCount: 0,
            markAsRead: () => {},
            markAllAsRead: () => {},
            deleteNotification: () => {},
            requestPermission: async () => 'denied' as NotificationPermission,
        };
    }
    return context;
};

