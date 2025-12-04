import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUserCircle, FaMoon, FaSun, FaSignOutAlt, FaExchangeAlt, FaCamera, FaSpinner, FaPhone, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getImageUrl } from '../utils/imageUtils';

// Helper function to get API base URL (same logic as in api.ts)
const getApiBaseURL = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return `http://${hostname}:3001`;
        }
    }
    return 'http://localhost:3001';
};

const Profile: React.FC = () => {
    const { currentUser, loginAs, logout, refreshUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isUploading, setIsUploading] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [avayaNumber, setAvayaNumber] = useState(currentUser?.avayaNumber || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: allUsers } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get<User[]>('/users');
            return response.data;
        },
    });

    const updateProfilePictureMutation = useMutation({
        mutationFn: async (profilePictureUrl: string) => {
            const response = await api.patch(`/users/${currentUser?.id}`, {
                profilePicture: profilePictureUrl,
            });
            return response.data;
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', currentUser?.id] });
            await refreshUser();
        },
    });

    const updateContactInfoMutation = useMutation({
        mutationFn: async (data: { phone?: string; avayaNumber?: string }) => {
            const response = await api.patch(`/users/${currentUser?.id}`, data);
            return response.data;
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', currentUser?.id] });
            await refreshUser();
            setIsEditingContact(false);
        },
    });

    React.useEffect(() => {
        if (currentUser) {
            setPhone(currentUser.phone || '');
            setAvayaNumber(currentUser.avayaNumber || '');
        }
    }, [currentUser]);

    const handleSaveContactInfo = () => {
        const updateData: { phone?: string | null; avayaNumber?: string | null } = {};
        // Always include phone - set to trimmed value or null to clear
        updateData.phone = phone.trim() || null;
        // Always include avayaNumber - set to trimmed value or null to clear
        updateData.avayaNumber = avayaNumber.trim() || null;
        updateContactInfoMutation.mutate(updateData);
    };

    const handleCancelEdit = () => {
        setPhone(currentUser?.phone || '');
        setAvayaNumber(currentUser?.avayaNumber || '');
        setIsEditingContact(false);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);

        try {
            // Upload the file
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await api.post('/files/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // The endpoint returns the URL path like "/uploads/profile-123.jpg"
            // We need to construct the full URL using the API base URL
            let profilePictureUrl = typeof uploadResponse.data === 'string' 
                ? uploadResponse.data 
                : uploadResponse.data.url || uploadResponse.data;
            
            // If it's a relative path, construct full URL
            if (profilePictureUrl.startsWith('/')) {
                const apiBaseURL = getApiBaseURL();
                profilePictureUrl = `${apiBaseURL}${profilePictureUrl}`;
            }

            // Update user profile with new picture URL
            await updateProfilePictureMutation.mutateAsync(profilePictureUrl);
        } catch (error: any) {
            console.error('Failed to upload profile picture:', error);
            alert('Failed to upload profile picture. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleEditPictureClick = () => {
        fileInputRef.current?.click();
    };

    if (!currentUser) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0 pt-0 md:pt-16">
            <div className="bg-white dark:bg-dark-paper p-6 flex flex-col items-center shadow-sm mb-4">
                <div className="relative mb-4">
                    {(() => {
                        const profilePictureUrl = getImageUrl(currentUser.profilePicture);
                        return profilePictureUrl ? (
                            <img
                                src={profilePictureUrl}
                                alt={currentUser.name}
                                className="w-24 h-24 rounded-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling;
                                    if (fallback) {
                                        (fallback as HTMLElement).style.display = 'block';
                                    }
                                }}
                            />
                        ) : null;
                    })()}
                    <FaUserCircle className="w-24 h-24 text-gray-400" style={{ display: currentUser.profilePicture ? 'none' : 'block' }} />
                    <button
                        onClick={handleEditPictureClick}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit profile picture"
                    >
                        {isUploading ? (
                            <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                            <FaCamera className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
                <div className="text-center mb-2">
                    <p className="text-lg text-gray-600 dark:text-dark-muted mb-2">Hello,</p>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">{currentUser.name}</h1>
                </div>
                <p className="text-gray-600 dark:text-dark-muted">{currentUser.jobTitle}</p>
                <span className="mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    {currentUser.role}
                </span>
            </div>

            {/* Contact Information Section */}
            <div className="bg-white dark:bg-dark-paper shadow-sm mb-4">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text flex items-center">
                            <FaPhone className="mr-2 text-[#005d99]" />
                            Contact Information
                        </h3>
                        {!isEditingContact ? (
                            <button
                                onClick={() => setIsEditingContact(true)}
                                className="text-[#005d99] hover:text-[#004d7a] transition-colors"
                                title="Edit contact info"
                            >
                                <FaEdit className="text-sm" />
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveContactInfo}
                                    disabled={updateContactInfoMutation.isPending}
                                    className="text-[#17a74a] hover:text-[#148a3d] transition-colors disabled:opacity-50"
                                    title="Save"
                                >
                                    <FaSave className="text-sm" />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                    title="Cancel"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-dark-muted mb-1 block">Phone Number</label>
                            {isEditingContact ? (
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-[#005d99]"
                                />
                            ) : (
                                <p className="text-sm text-gray-900 dark:text-dark-text">
                                    {currentUser.phone || <span className="text-gray-400 italic">Not set</span>}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-dark-muted mb-1 block">Extension Number (Avaya)</label>
                            {isEditingContact ? (
                                <input
                                    type="text"
                                    value={avayaNumber}
                                    onChange={(e) => setAvayaNumber(e.target.value)}
                                    placeholder="Enter extension number"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-[#005d99]"
                                />
                            ) : (
                                <p className="text-sm text-gray-900 dark:text-dark-text">
                                    {currentUser.avayaNumber || <span className="text-gray-400 italic">Not set</span>}
                                </p>
                            )}
                        </div>
                        {currentUser.email && (
                            <div>
                                <label className="text-xs text-gray-500 dark:text-dark-muted mb-1 block">Email</label>
                                <p className="text-sm text-gray-900 dark:text-dark-text">{currentUser.email}</p>
                            </div>
                        )}
                    </div>
                </div>
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
                                {(() => {
                                    const profilePictureUrl = getImageUrl(user.profilePicture);
                                    return profilePictureUrl ? (
                                        <img
                                            src={profilePictureUrl}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full object-cover mr-3"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.nextElementSibling;
                                                if (fallback) {
                                                    (fallback as HTMLElement).style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null;
                                })()}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-xs mr-3" style={{ display: user.profilePicture ? 'none' : 'flex' }}>
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
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
