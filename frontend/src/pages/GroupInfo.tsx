import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUsers, FaUserPlus, FaSignOutAlt, FaTrash, FaThumbtack, FaUserMinus, FaEdit, FaUpload } from 'react-icons/fa';
import { format } from 'date-fns';
import api from '../services/api';
import type { Group, User, Message } from '../types';
import { useAuth } from '../context/AuthContext';

const GroupInfo: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [showAddMember, setShowAddMember] = useState(false);

    const { data: group, isLoading } = useQuery({
        queryKey: ['group', id],
        queryFn: async () => {
            const response = await api.get<Group>(`/groups/${id}`);
            return response.data;
        },
    });

    const { data: allUsers } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get<User[]>('/users');
            return response.data;
        },
        enabled: showAddMember,
    });

    const { data: pinnedMessages = [] } = useQuery({
        queryKey: ['pinned-messages', id],
        queryFn: async () => {
            const response = await api.get<Message[]>(`/chat/pinned/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const addMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            await api.post(`/groups/${id}/members`, {
                userId,
                requesterId: currentUser?.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group', id] });
            setShowAddMember(false);
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            await api.delete(`/groups/${id}/members/${userId}`, {
                data: { requesterId: currentUser?.id },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group', id] });
        },
    });

    const leaveGroupMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/groups/${id}/leave`, { userId: currentUser?.id });
        },
        onSuccess: () => {
            navigate('/groups');
        },
    });

    const deleteGroupMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/groups/${id}`, {
                data: { requesterId: currentUser?.id },
            });
        },
        onSuccess: () => {
            navigate('/groups');
        },
    });

    if (isLoading || !group) {
        return <div className="p-4 text-center">Loading group info...</div>;
    }

    const isAdmin = group.members?.some(m => m.userId === currentUser?.id && m.role === 'admin');
    const isCreator = group.createdById === currentUser?.id;
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const canManageMembers = isAdmin || isSuperAdmin;

    const nonMembers = allUsers?.filter(u => 
        !group.members?.some(m => m.userId === u.id) && 
        u.accountState === 'ACTIVE'
    );

    return (
        <div className="flex flex-col h-full bg-secondary dark:bg-dark-bg overflow-y-auto pt-16">
            <div className="bg-white dark:bg-dark-paper p-6 flex flex-col items-center shadow-sm">
                {group.picture ? (
                    <img
                        src={group.picture}
                        alt={group.name}
                        className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                        <FaUsers className="text-gray-500 dark:text-gray-400 text-4xl" />
                    </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{group.name}</h1>
                <p className="text-gray-600 dark:text-dark-muted">
                    Group • {group.members?.length} participants
                </p>
            </div>

            <div className="mt-4 bg-white dark:bg-dark-paper shadow-sm">
                <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Participants</h2>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAddMember(true)}
                            className="text-primary hover:text-primary-dark flex items-center text-sm font-medium"
                        >
                            <FaUserPlus className="mr-1" /> Add
                        </button>
                    )}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {group.members?.map((member) => (
                        <div key={member.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center flex-1 min-w-0">
                                {member.user?.profilePicture ? (
                                    <img
                                        src={member.user.profilePicture}
                                        alt={member.user.name}
                                        className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                                        {member.user?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-dark-text truncate">
                                        {member.user?.name} {member.userId === currentUser?.id && '(You)'}
                                    </p>
                                    {member.role === 'admin' && (
                                        <span className="text-xs text-primary border border-primary px-1 rounded">
                                            Group Admin
                                        </span>
                                    )}
                                </div>
                            </div>
                            {canManageMembers && member.userId !== currentUser?.id && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Remove ${member.user?.name} from group?`)) {
                                            removeMemberMutation.mutate(member.userId);
                                        }
                                    }}
                                    className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
                                    title="Remove member"
                                >
                                    <FaUserMinus />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
                <div className="mt-4 bg-white dark:bg-dark-paper shadow-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text flex items-center">
                            <FaThumbtack className="mr-2 text-yellow-500" />
                            Pinned Messages
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pinnedMessages.map((message) => (
                            <div
                                key={message.id}
                                onClick={() => navigate(`/groups/${id}`)}
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                            >
                                <div className="flex items-start space-x-3">
                                    {message.sender?.profilePicture ? (
                                        <img
                                            src={message.sender.profilePicture}
                                            alt={message.sender.name}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            {message.sender?.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                                {message.sender?.name}
                                            </p>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-dark-muted truncate">
                                            {message.content || 'Sent an attachment'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 bg-white dark:bg-dark-paper shadow-sm p-4 space-y-2">
                <button
                    onClick={() => {
                        if (window.confirm('Are you sure you want to leave this group?')) {
                            leaveGroupMutation.mutate();
                        }
                    }}
                    className="w-full flex items-center justify-center text-red-500 font-medium py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <FaSignOutAlt className="mr-2" /> Exit Group
                </button>
                {isSuperAdmin && (
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                                deleteGroupMutation.mutate();
                            }
                        }}
                        className="w-full flex items-center justify-center text-red-600 dark:text-red-400 font-medium py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <FaTrash className="mr-2" /> Delete Group
                    </button>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-paper rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark-text">Add Participant</h2>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {nonMembers && nonMembers.length > 0 ? (
                                nonMembers.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => addMemberMutation.mutate(user.id)}
                                        className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                                    >
                                        {user.profilePicture ? (
                                            <img
                                                src={user.profilePicture}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover mr-3"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                                                {user.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-gray-900 dark:text-dark-text font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.jobTitle}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No more users to add.</p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowAddMember(false)}
                            className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupInfo;
