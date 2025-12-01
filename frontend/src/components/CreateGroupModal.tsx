import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaTimes, FaUpload, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, currentUserId }) => {
    const queryClient = useQueryClient();
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get<User[]>('/users');
            return response.data.filter((u) => u.id !== currentUserId && u.accountState === 'ACTIVE');
        },
    });

    const createGroupMutation = useMutation({
        mutationFn: async (data: any) => {
            let profilePictureUrl = '';
            
            if (profilePicture) {
                const formData = new FormData();
                formData.append('file', profilePicture);
                const uploadResponse = await api.post('/files/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                profilePictureUrl = uploadResponse.data;
            }

            const response = await api.post('/groups', {
                ...data,
                picture: profilePictureUrl,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            onClose();
            resetForm();
        },
    });

    const resetForm = () => {
        setGroupName('');
        setSelectedMembers([]);
        setProfilePicture(null);
        setPreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (groupName.trim()) {
            createGroupMutation.mutate({
                name: groupName,
                createdById: currentUserId,
                memberIds: selectedMembers,
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-dark-paper rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="sticky top-0 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Create Group</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <FaUpload className="text-gray-400 text-2xl" />
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-dark">
                                <FaUpload className="text-sm" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add Members ({selectedMembers.length} selected)
                        </label>
                        <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => toggleMember(user.id)}
                                    className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                                        selectedMembers.includes(user.id)
                                            ? 'bg-primary/10 border-2 border-primary'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {user.profilePicture ? (
                                        <img
                                            src={user.profilePicture}
                                            alt={user.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 dark:text-dark-text">
                                            {user.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {user.jobTitle}
                                        </p>
                                    </div>
                                    {selectedMembers.includes(user.id) && (
                                        <FaCheck className="text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createGroupMutation.isPending || !groupName.trim()}
                            className="btn-primary"
                        >
                            {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;

