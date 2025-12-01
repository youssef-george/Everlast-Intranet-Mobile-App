import React, { createContext, useContext, useState, useEffect } from 'react';
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

    // Check notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Fetch notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const response = await api.get<Notification[]>(`/notifications?userId=${currentUser.id}`);
            return response.data;
        },
        enabled: !!currentUser,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Get unread count
    const { data: unreadData } = useQuery({
        queryKey: ['notifications-unread', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return { count: 0 };
            const response = await api.get<{ count: number }>(`/notifications/unread-count?userId=${currentUser.id}`);
            return response.data;
        },
        enabled: !!currentUser,
        refetchInterval: 30000,
    });

    const unreadCount = unreadData?.count || 0;

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data: { type: string; title: string; content: string }) => {
            // Show browser notification if permission granted
            if (permission === 'granted') {
                new Notification(data.title, {
                    body: data.content,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: 'everlast-notification',
                    requireInteraction: false,
                });
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

    const requestPermission = async (): Promise<NotificationPermission> => {
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

