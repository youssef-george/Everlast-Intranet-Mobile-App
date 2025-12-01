import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaTimes, FaUpload } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: '',
        role: 'EMPLOYEE',
    });
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [newDepartment, setNewDepartment] = useState('');

    // Fetch departments
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await api.get<Array<{ name: string }>>('/departments');
            return response.data;
        },
        enabled: isOpen,
    });

    const createUserMutation = useMutation({
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

            const response = await api.post('/users', {
                ...data,
                profilePicture: profilePictureUrl,
                requesterId: currentUser?.id, // Include requester ID for permission check
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
            resetForm();
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            jobTitle: '',
            department: '',
            role: 'EMPLOYEE',
        });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-dark-paper rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Add Employee</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                            Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Job Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Department *
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="input-field flex-1"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.name} value={dept.name}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            {currentUser?.role === 'SUPER_ADMIN' && (
                                <input
                                    type="text"
                                    placeholder="Or add new..."
                                    value={newDepartment}
                                    onChange={(e) => {
                                        setNewDepartment(e.target.value);
                                        if (e.target.value) {
                                            setFormData({ ...formData, department: e.target.value });
                                        }
                                    }}
                                    className="input-field flex-1"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role *
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="input-field"
                        >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createUserMutation.isPending}
                            className="btn-primary"
                        >
                            {createUserMutation.isPending ? 'Adding...' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;

