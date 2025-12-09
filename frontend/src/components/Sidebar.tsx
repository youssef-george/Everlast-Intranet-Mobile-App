import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaUsers, FaComment, FaBell, FaBuilding, FaLink } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotificationsSafe } from '../context/NotificationsContext';
import QuickLinks from './QuickLinks';

const Sidebar: React.FC = () => {
    const { currentUser } = useAuth();
    const { unreadCount: unreadNotificationsCount } = useNotificationsSafe();
    const location = useLocation();

    // Get unread message count
    const { data: chats = [] } = useQuery({
        queryKey: ['recent-chats', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            try {
                const response = await api.get<any[]>(`/chat/recent/${currentUser.id}`);
                return response.data;
            } catch (error: any) {
                // Handle 404 gracefully - chat/recent endpoint might not exist
                if (error.response?.status === 404) {
                    return [];
                }
                throw error;
            }
        },
        enabled: !!currentUser,
        refetchInterval: 30000,
    });

    const unreadChatsCount = chats.reduce((total: number, chat: any) => total + (chat.unreadCount || 0), 0);

    const navItems = [
        { path: '/members', icon: FaUsers, label: 'Employees', badge: undefined },
        { path: '/messages', icon: FaComment, label: 'Messages', badge: unreadChatsCount },
        { path: '/notifications', icon: FaBell, label: 'Notifications', badge: unreadNotificationsCount },
        ...(currentUser?.role === 'SUPER_ADMIN' ? [{ path: '/departments', icon: FaBuilding, label: 'Departments', badge: undefined }] : []),
        { path: '/quick-links', icon: FaLink, label: 'Quick Links', badge: undefined },
    ];

    const isActive = (path: string) => {
        if (path === '/members') return location.pathname === '/members';
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-20 bg-white dark:bg-dark-paper border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col pt-6 z-40 shadow-sm">
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className="relative flex flex-col items-center justify-center py-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-dark-hover"
                    >
                        <div className="relative flex items-center justify-center mb-2">
                            <item.icon
                                className={`transition-all duration-200 ${
                                    active
                                        ? 'text-[#005d99] scale-110'
                                        : 'text-gray-400 scale-100'
                                }`}
                                style={{ fontSize: '26px' }}
                            />
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#17a74a] text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-semibold">
                                    {item.badge > 99 ? '99+' : item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </div>
                        <span className={`text-xs font-medium transition-colors ${
                            active
                                ? 'text-[#005d99]'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}>
                            {item.label}
                        </span>
                    </NavLink>
                );
            })}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700">
                <QuickLinks />
            </div>
        </aside>
    );
};

export default Sidebar;

