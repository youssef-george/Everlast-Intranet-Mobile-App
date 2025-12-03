import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUserCircle, FaPhone, FaEnvelope, FaBriefcase, FaBuilding, FaComment, FaEdit } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import EditEmployeeModal from '../components/EditEmployeeModal';

const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const { data: user, isLoading } = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            const response = await api.get<User>(`/users/${id}`);
            return response.data;
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/users/${id}/deactivate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const activateMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/users/${id}/activate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const startChat = () => {
        navigate(`/messages/${id}`);
    };

    if (isLoading || !user) {
        return <div className="p-4 text-center">Loading profile...</div>;
    }

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0 pt-16">
            {/* Header Image */}
            <div className="h-32 gradient-primary"></div>

            {/* Profile Info */}
            <div className="px-4 md:px-8 -mt-16 pb-4">
                <div className="relative inline-block">
                    {user.profilePicture ? (
                        <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-32 h-32 rounded-full border-4 border-white dark:border-dark-bg object-cover"
                        />
                    ) : (
                        <FaUserCircle className="w-32 h-32 text-gray-400 bg-white rounded-full border-4 border-white dark:border-dark-bg" />
                    )}
                    {user.isOnline && (
                        <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-dark-bg"></div>
                    )}
                </div>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{user.name}</h1>
                    <p className="text-gray-600 dark:text-dark-muted">{user.jobTitle}</p>

                    <div className="flex items-center mt-2 space-x-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.accountState === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                            {user.accountState}
                        </span>
                        {!user.isOnline && user.lastSeen && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Last seen: {new Date(user.lastSeen).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex mt-6 space-x-3">
                    <button
                        onClick={startChat}
                        className="flex-1 btn-primary flex items-center justify-center space-x-2"
                    >
                        <FaComment />
                        <span>Message</span>
                    </button>

                    {isSuperAdmin && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <FaEdit />
                                <span>Edit</span>
                            </button>
                            {user.id !== currentUser?.id && (
                                <button
                                    onClick={() => {
                                        if (user.accountState === 'ACTIVE') {
                                            if (window.confirm('Are you sure you want to deactivate this user?')) {
                                                deactivateMutation.mutate();
                                            }
                                        } else {
                                            activateMutation.mutate();
                                        }
                                    }}
                                    className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center ${user.accountState === 'ACTIVE'
                                            ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                        }`}
                                >
                                    {user.accountState === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Details Card */}
                <div className="mt-6 bg-white dark:bg-dark-paper rounded-lg shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                    <div className="p-4 flex items-center space-x-4">
                        <FaBuilding className="text-gray-400 text-xl" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-dark-muted">Department</p>
                            <p className="text-gray-900 dark:text-dark-text font-medium">{user.department}</p>
                        </div>
                    </div>

                    <div className="p-4 flex items-center space-x-4">
                        <FaBriefcase className="text-gray-400 text-xl" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-dark-muted">Job Title</p>
                            <p className="text-gray-900 dark:text-dark-text font-medium">{user.jobTitle}</p>
                        </div>
                    </div>

                    <div className="p-4 flex items-center space-x-4">
                        <FaEnvelope className="text-gray-400 text-xl" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-dark-muted">Email</p>
                            <p className="text-gray-900 dark:text-dark-text font-medium">{user.email}</p>
                        </div>
                    </div>

                    {user.phone && (
                        <div className="p-4 flex items-center space-x-4">
                            <FaPhone className="text-gray-400 text-xl" />
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Phone</p>
                                <p className="text-gray-900 dark:text-dark-text font-medium">{user.phone}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <EditEmployeeModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                user={user}
            />
        </div>
    );
};

export default EmployeeProfile;
