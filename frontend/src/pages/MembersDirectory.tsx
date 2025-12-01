import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaPlus, FaEdit, FaBan, FaCheck, FaComment, FaEye } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import AddEmployeeModal from '../components/AddEmployeeModal';
import EditEmployeeModal from '../components/EditEmployeeModal';

const MembersDirectory: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get<User[]>(
                currentUser?.role === 'SUPER_ADMIN'
                    ? '/users?includeDeactivated=true'
                    : '/users'
            );
            return response.data;
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: async (userId: string) => {
            await api.patch(`/users/${userId}/deactivate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const activateMutation = useMutation({
        mutationFn: async (userId: string) => {
            await api.patch(`/users/${userId}/activate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    // Get unique departments
    const departments = React.useMemo(() => {
        if (!users) return [];
        const depts = new Set(users.map(u => u.department));
        return Array.from(depts).sort();
    }, [users]);

    const filteredUsers = users?.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.department.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        if (filter === 'online') {
            matchesFilter = user.isOnline;
        } else if (filter !== 'all') {
            matchesFilter = user.department === filter;
        }

        const matchesState = currentUser?.role === 'SUPER_ADMIN' || user.accountState === 'ACTIVE';

        return matchesSearch && matchesFilter && matchesState;
    });

    const handleEdit = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleDeactivate = async (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        if (user.accountState === 'ACTIVE') {
            deactivateMutation.mutate(user.id);
        } else {
            activateMutation.mutate(user.id);
        }
    };

    const handleMessage = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        navigate(`/chats/${userId}`);
    };

    const handleView = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        navigate(`/members/${userId}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0">
            {/* Page Header */}
            <div className="p-8 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-text mb-2">
                    Members Directory
                </h1>
                <p className="text-gray-600 dark:text-dark-muted">
                    All company employees and their profiles
                </p>
            </div>

            {/* Filters */}
            <div className="p-6 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-dark-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary'
                        }`}
                    >
                        All Employees
                    </button>
                    {departments.map((dept) => (
                        <button
                            key={dept}
                            onClick={() => setFilter(dept)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === dept
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-dark-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary'
                            }`}
                        >
                            {dept}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilter('online')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'online'
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-dark-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary'
                        }`}
                    >
                        Online Only
                    </button>
                </div>
            </div>

            {/* Employee Grid */}
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers?.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => navigate(`/members/${user.id}`)}
                            className="bg-white dark:bg-dark-paper rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            {/* Card Header */}
                            <div className="flex items-start gap-4 mb-4">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    {user.profilePicture ? (
                                        <img
                                            src={user.profilePicture}
                                            alt={user.name}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-lg">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    {user.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-3 border-white dark:border-dark-paper"></div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text truncate mb-1">
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-dark-muted truncate mb-0.5">
                                        {user.jobTitle}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user.department}
                                    </p>
                                    <span
                                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                            user.accountState === 'ACTIVE'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        }`}
                                    >
                                        {user.accountState}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={(e) => handleMessage(e, user.id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <FaComment className="text-xs" />
                                    Message
                                </button>
                                <button
                                    onClick={(e) => handleView(e, user.id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                                >
                                    <FaEye className="text-xs" />
                                    View
                                </button>
                                {currentUser?.role === 'SUPER_ADMIN' && (
                                    <>
                                        <button
                                            onClick={(e) => handleEdit(e, user)}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-primary rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeactivate(e, user)}
                                            className={`px-3 py-2 rounded-lg transition-colors ${
                                                user.accountState === 'ACTIVE'
                                                    ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500'
                                                    : 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-500'
                                            }`}
                                            title={user.accountState === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                        >
                                            {user.accountState === 'ACTIVE' ? <FaBan /> : <FaCheck />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredUsers?.length === 0 && (
                    <div className="text-center py-12">
                        <FaUserCircle className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-dark-muted mb-4">No members found</p>
                        {currentUser?.role === 'SUPER_ADMIN' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="text-primary font-medium hover:underline"
                            >
                                Add your first employee
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* FAB - Floating Action Button (Super Admin Only) */}
            {currentUser?.role === 'SUPER_ADMIN' && (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="fixed bottom-24 md:bottom-8 right-8 w-16 h-16 gradient-primary text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center z-40"
                    title="Add Employee"
                >
                    <FaPlus className="text-2xl" />
                </button>
            )}

            {/* Modals */}
            <AddEmployeeModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            <EditEmployeeModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
            />
        </div>
    );
};

export default MembersDirectory;
