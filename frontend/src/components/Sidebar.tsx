import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaComment, FaBell, FaBuilding } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
    const { currentUser } = useAuth();

    // Get unread message count
    const { data: chats = [] } = useQuery({
        queryKey: ['recent-chats', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const response = await api.get<any[]>(`/chat/recent/${currentUser.id}`);
            return response.data;
        },
        enabled: !!currentUser,
        refetchInterval: 30000,
    });

    const unreadMessagesCount = chats.filter((chat: any) => chat.unreadCount > 0).length;

    // Get unread notifications count
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

    const unreadNotificationsCount = unreadData?.count || 0;

    const navItems = [
        {
            path: '/members',
            icon: FaUsers,
            label: 'Employees',
            badge: 0,
        },
        {
            path: '/messages',
            icon: FaComment,
            label: 'Messages',
            badge: unreadMessagesCount,
        },
        {
            path: '/notifications',
            icon: FaBell,
            label: 'Notifications',
            badge: unreadNotificationsCount,
        },
        ...(currentUser?.role === 'SUPER_ADMIN' ? [{
            path: '/departments',
            icon: FaBuilding,
            label: 'Departments',
            badge: 0,
        }] : []),
    ];

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-20 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col pt-6 z-40">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `relative flex flex-col items-center justify-center py-4 transition-all ${
                            isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary text-primary'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`
                    }
                >
                    <div className="relative">
                        <item.icon className="text-2xl mb-2" />
                        {item.badge > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {item.badge > 9 ? '9+' : item.badge}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                </NavLink>
            ))}
        </aside>
    );
};

export default Sidebar;

