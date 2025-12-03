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
                return response.data;
            } catch (error: any) {
                // Handle 404 gracefully - notifications endpoint might not exist
                if (error.response?.status === 404) {
                    return [];
                }
                throw error;
            }
        },
        enabled: !!currentUser,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Get unread count
    const { data: unreadData } = useQuery({
        queryKey: ['notifications-unread', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return { count: 0 };
            try {
                const response = await api.get<{ count: number }>(`/notifications/unread-count?userId=${currentUser.id}`);
                return response.data;
            } catch (error: any) {
                // Handle 404 gracefully - notifications endpoint might not exist
                if (error.response?.status === 404) {
                    return { count: 0 };
                }
                throw error;
            }
        },
        enabled: !!currentUser,
        refetchInterval: 30000,
    });

    const unreadCount = unreadData?.count || 0;

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleNewNotification = (data: { type: string; title: string; content: string }) => {
            // Check permission again in case it changed
            const currentPermission = 'Notification' in window ? Notification.permission : 'denied';
            
            // Show browser notification if permission granted
            if (currentPermission === 'granted') {
                try {
                    new Notification(data.title, {
                        body: data.content,
                        icon: '/icon.png',
                        badge: '/icon.png',
                        tag: 'everlast-notification',
                        requireInteraction: false,
                        silent: false,
                    });
                } catch (error) {
                    console.error('Failed to show notification:', error);
                }
            } else if (currentPermission === 'default') {
                // Try to request permission again if it's still default
                // Note: requestPermission is available via context, but we'll check permission directly here
                if ('Notification' in window) {
                    Notification.requestPermission().then((result) => {
                        setPermission(result);
                    }).catch(console.error);
                }
            }

            // Invalidate queries to refetch notifications
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread', currentUser?.id] });
        };

        socket.on('newNotification', handleNewNotification);

        return () => {
            socket.off('newNotification', handleNewNotification);
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

