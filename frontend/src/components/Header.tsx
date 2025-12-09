import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import ProfileDropdown from './ProfileDropdown';
import { getImageUrl } from '../utils/imageUtils';

const Header: React.FC = () => {
    const { currentUser } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

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
                <button
                    onClick={() => navigate('/members')}
                    className="w-[90px] md:w-[120px] flex-shrink-0 h-8 md:h-10 flex items-center pr-3 md:pr-0 cursor-pointer hover:opacity-80 transition-opacity touch-manipulation"
                    aria-label="Go to home page"
                >
                    {/* Mobile logo - always visible on mobile, hidden on desktop */}
                    <img
                        src="/cropped-EWMC-Logo-1.png"
                        alt="Everlast"
                        className="h-10 w-auto object-contain md:hidden"
                        onError={(e) => {
                            console.error('Failed to load mobile logo, showing fallback text');
                            e.currentTarget.style.display = 'none';
                            const fallback = document.querySelector('.logo-fallback') as HTMLElement;
                            if (fallback) {
                                fallback.style.display = 'block';
                            }
                        }}
                    />
                    {/* Desktop - Light mode logo */}
                    <img
                        src="/EWMC-Logo-1.png"
                        alt="Everlast"
                        className="h-full w-auto object-contain hidden md:block dark:hidden"
                        onError={(e) => {
                            console.error('Failed to load desktop logo, showing fallback text');
                            e.currentTarget.style.display = 'none';
                            const fallback = document.querySelector('.logo-fallback') as HTMLElement;
                            if (fallback) {
                                fallback.style.display = 'block';
                            }
                        }}
                    />
                    {/* Desktop - Dark mode logo */}
                    <img
                        src="/EWMC-Logo-1-768x199-1.webp"
                        alt="Everlast"
                        className="h-full w-auto object-contain hidden md:dark:block"
                        onError={(e) => {
                            console.error('Failed to load dark mode logo, showing fallback text');
                            e.currentTarget.style.display = 'none';
                            const fallback = document.querySelector('.logo-fallback') as HTMLElement;
                            if (fallback) {
                                fallback.style.display = 'block';
                            }
                        }}
                    />
                    {/* Fallback text logo */}
                    <span className="logo-fallback hidden text-xl md:text-2xl font-bold text-[#005d99] dark:text-[#17a74a]">
                        Everlast
                    </span>
                </button>

                {/* Search Bar */}
                <div className="flex-1 min-w-0 max-w-xl mx-auto flex justify-center md:justify-start">
                    <div className="w-full max-w-full">
                        <SearchBar />
                    </div>
                </div>

                {/* User Menu */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                    >
                        {(() => {
                            const profilePictureUrl = getImageUrl(currentUser.profilePicture);
                            return profilePictureUrl ? (
                                <img
                                    src={profilePictureUrl}
                                    alt={currentUser.name}
                                    className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                                    onError={(e) => {
                                        // Hide broken image and show initials fallback
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback && fallback.classList.contains('profile-fallback')) {
                                            fallback.style.display = 'flex';
                                        }
                                    }}
                                />
                            ) : null;
                        })()}
                        <div className="profile-fallback w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm" style={{ background: 'linear-gradient(135deg, #005d99, #17a74a)', display: currentUser.profilePicture ? 'none' : 'flex' }}>
                            {getInitials(currentUser.name)}
                        </div>
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
