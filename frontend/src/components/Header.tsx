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
        <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-paper border-b border-[#e5e5e5] dark:border-gray-700 z-50 shadow-sm">
            <div className="flex items-center h-full px-6">
                {/* Logo */}
                <div className="w-[120px]">
                    <div className="text-xl font-bold flex items-center gap-2" style={{ color: '#005d99' }}>
                        <span className="text-2xl">⚡️</span>
                        <span>Everlast</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-xl mx-auto">
                    <SearchBar />
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        {currentUser.profilePicture ? (
                            <img
                                src={currentUser.profilePicture}
                                alt={currentUser.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #005d99, #17a74a)' }}>
                                {getInitials(currentUser.name)}
                            </div>
                        )}
                        <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-dark-text">
                            {currentUser.name}
                        </span>
                        <span className="hidden md:block text-gray-500 dark:text-gray-400 text-xs">
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

