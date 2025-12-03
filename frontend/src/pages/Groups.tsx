import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaUsers, FaSearch } from 'react-icons/fa';
import { format, isToday } from 'date-fns';
import api from '../services/api';
import type { Group } from '../types';
import { useAuth } from '../context/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';

const Groups: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['groups', currentUser?.id],
        queryFn: async () => {
            const response = await api.get<Group[]>('/groups?userId=' + currentUser?.id);
            return response.data;
        },
        enabled: !!currentUser,
    });

    const filteredGroups = groups.filter((group) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return group.name.toLowerCase().includes(query);
    });

    // Sort by last message time or creation time
    const sortedGroups = [...filteredGroups].sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
    });

    if (isLoading) {
        return <div className="p-4 text-center">Loading groups...</div>;
    }

    const canCreateGroup = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0 pt-16">
            {/* Page Header */}
            <div className="p-8 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-text mb-2">
                            Groups
                        </h1>
                        <p className="text-gray-600 dark:text-dark-muted">
                            Your group conversations
                        </p>
                    </div>
                    {canCreateGroup && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FaPlus />
                            <span className="hidden md:inline">Create Group</span>
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-dark-text focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="flex-1 p-6 space-y-3">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading groups...</div>
                ) : sortedGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>{searchQuery ? 'No groups found' : 'No groups yet.'}</p>
                        {canCreateGroup && !searchQuery && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 text-primary font-medium hover:underline"
                            >
                                Create your first group
                            </button>
                        )}
                    </div>
                ) : (
                    sortedGroups.map((group) => (
                    <div
                        key={group.id}
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="bg-white dark:bg-dark-paper p-4 rounded-lg shadow-sm flex items-center space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                    >
                        {group.picture ? (
                            <img
                                src={group.picture}
                                alt={group.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <FaUsers className="text-gray-500 dark:text-gray-400 text-xl" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text truncate">
                                {group.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-dark-muted">
                                {group.members?.length || 0} members
                                {group.lastMessage && (
                                    <>
                                        {' • '}
                                        {isToday(new Date(group.lastMessage.createdAt))
                                            ? format(new Date(group.lastMessage.createdAt), 'h:mm a')
                                            : format(new Date(group.lastMessage.createdAt), 'MMM d')}
                                    </>
                                )}
                            </p>
                            {group.lastMessage && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                    {group.lastMessage.content || 'Sent an attachment'}
                                </p>
                            )}
                        </div>
                    </div>
                    ))
                )}
            </div>

            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                currentUserId={currentUser?.id || ''}
            />
        </div>
    );
};

export default Groups;



