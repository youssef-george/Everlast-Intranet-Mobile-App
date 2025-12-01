import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaUserCircle, FaMoon, FaSun, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Profile: React.FC = () => {
    const { currentUser, loginAs, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const { data: allUsers } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get<User[]>('/users');
            return response.data;
        },
    });

    if (!currentUser) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0">
            <div className="bg-white dark:bg-dark-paper p-6 flex flex-col items-center shadow-sm mb-4">
                {currentUser.profilePicture ? (
                    <img
                        src={currentUser.profilePicture}
                        alt={currentUser.name}
                        className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                ) : (
                    <FaUserCircle className="w-24 h-24 text-gray-400 mb-4" />
                )}
                <div className="text-center mb-2">
                    <p className="text-lg text-gray-600 dark:text-dark-muted mb-2">Hello,</p>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">{currentUser.name}</h1>
                </div>
                <p className="text-gray-600 dark:text-dark-muted">{currentUser.jobTitle}</p>
                <span className="mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    {currentUser.role}
                </span>
            </div>

            <div className="bg-white dark:bg-dark-paper shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                <div
                    onClick={toggleTheme}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover"
                >
                    <div className="flex items-center text-gray-900 dark:text-dark-text">
                        {theme === 'light' ? <FaMoon className="mr-3 text-gray-500" /> : <FaSun className="mr-3 text-yellow-500" />}
                        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`} />
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted mb-3 flex items-center">
                        <FaExchangeAlt className="mr-2" /> Switch User (Demo)
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        {allUsers?.filter(u => u.id !== currentUser.id).map(user => (
                            <button
                                key={user.id}
                                onClick={() => loginAs(user.id)}
                                className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                            >
                                <img
                                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}`}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover mr-3"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-dark-muted">{user.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    onClick={logout}
                    className="p-4 flex items-center text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <FaSignOutAlt className="mr-3" />
                    <span>Logout</span>
                </div>
            </div>
        </div>
    );
};

export default Profile;
