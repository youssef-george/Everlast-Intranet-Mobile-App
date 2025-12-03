import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaBuilding, FaUsers, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Departments: React.FC = () => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await api.get<Array<{ name: string }>>('/departments');
            return response.data;
        },
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data;
        },
    });

    const createDepartmentMutation = useMutation({
        mutationFn: async (name: string) => {
            await api.post('/departments', {
                name,
                requesterId: currentUser?.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setShowAddModal(false);
            setNewDeptName('');
        },
    });

    const getDepartmentCount = (deptName: string) => {
        return allUsers.filter((u: any) => u.department === deptName && u.accountState === 'ACTIVE').length;
    };

    if (currentUser?.role !== 'SUPER_ADMIN') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                    <p>Access Denied</p>
                    <p className="text-sm mt-2">Only Super Admin can manage departments</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0 pt-16">
            {/* Page Header */}
            <div className="p-8 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-text mb-2">
                            Departments
                        </h1>
                        <p className="text-gray-600 dark:text-dark-muted">
                            Manage company departments
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <FaPlus />
                        <span className="hidden md:inline">Add Department</span>
                    </button>
                </div>
            </div>

            {/* Departments List */}
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept) => {
                        const count = getDepartmentCount(dept.name);
                        return (
                            <div
                                key={dept.name}
                                className="bg-white dark:bg-dark-paper rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FaBuilding className="text-primary text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                                {dept.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-dark-muted flex items-center gap-1">
                                                <FaUsers className="text-xs" />
                                                {count} {count === 1 ? 'employee' : 'employees'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {departments.length === 0 && (
                    <div className="text-center py-12">
                        <FaBuilding className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-dark-muted mb-4">No departments yet</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-primary font-medium hover:underline"
                        >
                            Create your first department
                        </button>
                    </div>
                )}
            </div>

            {/* Add Department Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-dark-paper rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">
                                Add Department
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewDeptName('');
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (newDeptName.trim()) {
                                    createDepartmentMutation.mutate(newDeptName.trim());
                                }
                            }}
                            className="p-4 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    placeholder="e.g., Engineering, Marketing, Sales"
                                    className="input-field"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewDeptName('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createDepartmentMutation.isPending}
                                    className="btn-primary"
                                >
                                    {createDepartmentMutation.isPending ? 'Adding...' : 'Add Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Departments;

