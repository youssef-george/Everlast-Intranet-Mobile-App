import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaComment, FaUser, FaBuilding, FaBell } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

const BottomNav: React.FC = () => {
    const { currentUser } = useAuth();
    const { unreadCount: unreadNotificationsCount } = useNotifications();

    const { data: chats = [] } = useQuery({
        queryKey: ['recent-chats', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const response = await api.get<any[]>(`/chat/recent/${currentUser.id}`);
            return response.data;
        },
        enabled: !!currentUser,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const unreadChatsCount = chats.filter((chat: any) => chat.unreadCount > 0).length;

    const navItems = [
        { path: '/members', icon: FaUsers, label: 'Employees' },
        { path: '/messages', icon: FaComment, label: 'Messages', badge: unreadChatsCount },
        { path: '/notifications', icon: FaBell, label: 'Notifications', badge: unreadNotificationsCount },
        ...(currentUser?.role === 'SUPER_ADMIN' ? [{ path: '/departments', icon: FaBuilding, label: 'Departments' }] : []),
        { path: '/profile', icon: FaUser, label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-paper border-t border-gray-200 dark:border-gray-700 pb-safe z-40 shadow-lg">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                                ? 'text-primary dark:text-primary-light'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <item.icon className="text-2xl" />
                                    {item.badge && item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
