import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaUsers, FaComment, FaUser, FaBuilding, FaBell, FaLink } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotificationsSafe } from '../context/NotificationsContext';

const BottomNav: React.FC = () => {
    const { currentUser } = useAuth();
    const { unreadCount: unreadNotificationsCount } = useNotificationsSafe();
    const location = useLocation();

    // Hide bottom nav when in a chat window on mobile
    const isChatWindow = React.useMemo(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        return (
            (pathSegments[0] === 'messages' && pathSegments.length > 1) ||
            (pathSegments[0] === 'chats' && pathSegments.length > 1) ||
            (pathSegments[0] === 'groups' && pathSegments.length > 1 && pathSegments[pathSegments.length - 1] !== 'info')
        );
    }, [location.pathname]);
    
    // Don't render at all in chat windows
    if (isChatWindow) {
        return null;
    }

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

    const unreadChatsCount = chats.reduce((total: number, chat: any) => total + (chat.unreadCount || 0), 0);

    const navItems = [
        { path: '/members', icon: FaUsers, badge: undefined },
        { path: '/messages', icon: FaComment, badge: unreadChatsCount },
        { path: '/notifications', icon: FaBell, badge: unreadNotificationsCount },
        { path: '/quick-links', icon: FaLink, badge: undefined },
        { path: '/profile', icon: FaUser, badge: undefined },
    ];

    const isActive = (path: string) => {
        if (path === '/members') return location.pathname === '/members';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm z-50 pb-safe">
            <div className="flex justify-around items-center h-14 px-2">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="relative flex items-center justify-center w-full h-full transition-all duration-200"
                        >
                            <div className="relative flex items-center justify-center">
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
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
