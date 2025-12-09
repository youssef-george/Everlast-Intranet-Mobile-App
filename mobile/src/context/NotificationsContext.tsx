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
    requestPermission: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const { socket } = useSocketSafe();
    const queryClient = useQueryClient();

    // Request permission function (for future push notification setup)
    const requestPermission = useCallback(async (): Promise<boolean> => {
        // TODO: Implement push notification permission request
        // For now, return true as placeholder
        return true;
    }, []);

    // Fetch notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            try {
                const response = await api.get<Notification[]>(`/notifications?userId=${currentUser.id}`);
                return response.data || [];
            } catch (error: any) {
                if (error.response?.status === 404) {
                    return [];
                }
                console.error('Error fetching notifications:', error);
                return [];
            }
        },
        enabled: !!currentUser,
        refetchInterval: 30000,
        retry: 1,
    });

    // Get unread count
    const { data: unreadData } = useQuery({
        queryKey: ['notifications-unread', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return { count: 0 };
            try {
                const response = await api.get<{ count: number }>(`/notifications/unread-count?userId=${currentUser.id}`);
                return response.data || { count: 0 };
            } catch (error: any) {
                if (error.response?.status === 404) {
                    return { count: 0 };
                }
                console.error('Error fetching unread count:', error);
                return { count: 0 };
            }
        },
        enabled: !!currentUser,
        refetchInterval: 30000,
        retry: 1,
    });

    const unreadCount = unreadData?.count || 0;

    // Listen for real-time notification updates
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleNewNotification = (data: { type: string; title: string; content: string; link?: string }) => {
            console.log('🔔 Received newNotification event:', data);
            // Refetch notifications
            queryClient.refetchQueries({ queryKey: ['notifications-unread', currentUser?.id] });
            queryClient.refetchQueries({ queryKey: ['notifications', currentUser?.id] });
        };

        const handleNotificationCountUpdate = (data: { count: number }) => {
            console.log('🔔 Received notificationCountUpdate event:', data);
            queryClient.refetchQueries({ queryKey: ['notifications-unread', currentUser?.id] });
            queryClient.refetchQueries({ queryKey: ['notifications', currentUser?.id] });
        };

        socket.on('newNotification', handleNewNotification);
        socket.on('notificationCountUpdate', handleNotificationCountUpdate);

        return () => {
            socket.off('newNotification', handleNewNotification);
            socket.off('notificationCountUpdate', handleNotificationCountUpdate);
        };
    }, [socket, currentUser, queryClient]);

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

