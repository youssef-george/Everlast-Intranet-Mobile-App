import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const Layout: React.FC = () => {
    const location = useLocation();
    
    // Check if we're in a chat window (hide bottom nav on mobile)
    const isChatWindow = React.useMemo(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        return (
            (pathSegments[0] === 'messages' && pathSegments.length > 1) || // /messages/:id
            (pathSegments[0] === 'chats' && pathSegments.length > 1) ||     // /chats/:id
            (pathSegments[0] === 'groups' && pathSegments.length > 1 && pathSegments[pathSegments.length - 1] !== 'info') // /groups/:id (not /groups/:id/info)
        );
    }, [location.pathname]);

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Fixed Header - Hidden on mobile when in chat */}
            <div className={isChatWindow ? 'hidden md:block' : ''}>
                <Header />
            </div>

            {/* Main Container */}
            <div className={`flex flex-1 overflow-hidden ${isChatWindow ? '' : 'mobile-content-offset'}`}>
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden md:ml-20">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation - Hidden in chat windows */}
            {!isChatWindow && (
                <div className="block md:hidden">
                    <BottomNav />
                </div>
            )}
        </div>
    );
};

export default Layout;
