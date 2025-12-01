import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaMoon, FaSun, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface ProfileDropdownProps {
    onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleViewProfile = () => {
        navigate('/profile');
        onClose();
    };

    const handleToggleTheme = () => {
        toggleTheme();
    };

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-paper rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-fade-in z-50"
        >
            {/* View Profile */}
            <button
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
                <FaUser className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                    View Profile
                </span>
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

            {/* Theme Toggle */}
            <button
                onClick={handleToggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
                {theme === 'light' ? (
                    <>
                        <FaMoon className="text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                            Dark Mode
                        </span>
                    </>
                ) : (
                    <>
                        <FaSun className="text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                            Light Mode
                        </span>
                    </>
                )}
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
            >
                <FaSignOutAlt className="text-red-500" />
                <span className="text-sm font-medium text-red-500">
                    Logout
                </span>
            </button>
        </div>
    );
};

export default ProfileDropdown;

