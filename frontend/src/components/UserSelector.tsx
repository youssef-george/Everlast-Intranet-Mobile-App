import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaUserCircle, FaCheck, FaSearch } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';

interface UserSelectorProps {
    onSelect: (userId: string) => void;
    currentUserId?: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onSelect, currentUserId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(true); // Start open when rendered

    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            try {
                const response = await api.get<User[]>('/users?includeDeactivated=true');
                return response.data;
            } catch (err) {
                console.error('Failed to fetch users:', err);
                throw err;
            }
        },
        retry: 2,
    });

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (userId: string) => {
        onSelect(userId);
        setIsOpen(false);
        setSearchQuery('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
                <FaUserCircle className="text-xl" />
                <span>Select User</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-dark-paper rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-4">
                        Select User
                    </h2>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {error ? (
                        <div className="text-center py-8 px-4">
                            <div className="text-red-500 mb-4">
                                <p className="text-lg font-semibold mb-2">⚠️ Backend Server Not Running</p>
                                <p className="text-sm">Unable to connect to backend at http://localhost:3001</p>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-semibold mb-2">To start the backend server:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                    <li>Open a terminal in the <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">backend</code> folder</li>
                                    <li>Run: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">npm run start:dev</code></li>
                                    <li>Wait for the server to start on port 3001</li>
                                    <li>Refresh this page</li>
                                </ol>
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No users found</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelect(user.id)}
                                    className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors ${
                                        currentUserId === user.id
                                            ? 'bg-primary/10 dark:bg-primary/20'
                                            : ''
                                    }`}
                                >
                                    {user.profilePicture ? (
                                        <img
                                            src={user.profilePicture}
                                            alt={user.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <FaUserCircle className="w-12 h-12 text-gray-400" />
                                    )}
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-dark-text truncate">
                                                {user.name}
                                            </h3>
                                            {currentUserId === user.id && (
                                                <FaCheck className="text-primary flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-dark-muted truncate">
                                            {user.email}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {user.role}
                                            </span>
                                            {user.accountState === 'DEACTIVATED' && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                                                    Deactivated
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setSearchQuery('');
                        }}
                        className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserSelector;

