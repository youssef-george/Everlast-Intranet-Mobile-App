import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import ProfileDropdown from './ProfileDropdown';

const Header: React.FC = () => {
    const { currentUser } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    if (!currentUser) return null;

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-white dark:bg-dark-paper border-b border-[#e5e5e5] dark:border-gray-700 z-50 shadow-sm" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}>
            <div className="flex items-center h-16 px-3 md:px-6 gap-2 md:gap-4">
                {/* Logo */}
                <div className="w-[90px] md:w-[120px] flex-shrink-0">
                    <div className="text-base md:text-xl font-bold flex items-center gap-1 md:gap-2" style={{ color: '#005d99' }}>
                        <span className="text-xl md:text-2xl">⚡️</span>
                        <span className="hidden sm:inline">Everlast</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex-1 min-w-0 max-w-xl mx-auto">
                    <SearchBar />
                </div>

                {/* User Menu */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                    >
                        {currentUser.profilePicture ? (
                            <img
                                src={currentUser.profilePicture}
                                alt={currentUser.name}
                                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm" style={{ background: 'linear-gradient(135deg, #005d99, #17a74a)' }}>
                                {getInitials(currentUser.name)}
                            </div>
                        )}
                        <span className="hidden lg:block text-sm font-medium text-gray-900 dark:text-dark-text">
                            {currentUser.name}
                        </span>
                        <span className="hidden lg:block text-gray-500 dark:text-gray-400 text-xs">
                            ▼
                        </span>
                    </button>

                    {showDropdown && (
                        <ProfileDropdown onClose={() => setShowDropdown(false)} />
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

