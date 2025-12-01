import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const Layout: React.FC = () => {
    const location = useLocation();
    const isChatWindow = location.pathname.includes('/chats/') || (location.pathname.includes('/groups/') && !location.pathname.includes('/info'));

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text overflow-hidden">
            {/* Fixed Header */}
            <Header />

            {/* Main Container */}
            <div className="flex flex-1 overflow-hidden mt-16">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden md:ml-20">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            {!isChatWindow && (
                <div className="block md:hidden">
                    <BottomNav />
                </div>
            )}
        </div>
    );
};

export default Layout;
