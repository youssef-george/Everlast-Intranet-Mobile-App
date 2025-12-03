import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { FaBell, FaCheck, FaTrash, FaComment, FaUsers, FaAt, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Notification } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, requestPermission } = useNotifications();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    // Request notification permission on mount (if not already granted)
    useEffect(() => {
        if ('Notification' in window) {
            const currentPermission = Notification.permission;
            // Auto-request permission if default or denied (user might have changed browser settings)
            if (currentPermission === 'default' || currentPermission === 'denied') {
                requestPermission().catch(console.error);
            }
        }
    }, [requestPermission]);

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'MESSAGE':
                return <FaComment className="text-primary" />;
            case 'REPLY':
                return <FaComment className="text-secondary" />;
            case 'MENTION':
                return <FaAt className="text-accent" />;
            case 'GROUP_ADD':
            case 'GROUP_REMOVE':
                return <FaUsers className="text-primary" />;
            case 'SYSTEM':
                return <FaExclamationCircle className="text-yellow-500" />;
            default:
                return <FaBell className="text-gray-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return format(date, 'h:mm a');
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM d, yyyy');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0 pt-16">
            {/* Page Header */}
            <div className="p-8 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-text mb-2">
                            Notifications
                        </h1>
                        <p className="text-gray-600 dark:text-dark-muted">
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FaCheck />
                            <span className="hidden md:inline">Mark all as read</span>
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'unread'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 p-6">
                {filteredNotifications.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FaBell className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </h2>
                            <p className="text-gray-600 dark:text-dark-muted">
                                {filter === 'unread' 
                                    ? 'You\'re all caught up!' 
                                    : 'When you receive notifications, they will appear here'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`bg-white dark:bg-dark-paper rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all ${
                                    !notification.isRead ? 'border-l-4 border-l-primary' : ''
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text">
                                                {notification.title}
                                            </h3>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-dark-muted mb-2">
                                            {notification.content}
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="Delete"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
