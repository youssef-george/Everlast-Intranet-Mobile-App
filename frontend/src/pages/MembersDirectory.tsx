import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaPlus, FaEdit, FaBan, FaCheck, FaComment, FaEye, FaUsers, FaTh, FaList, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import AddEmployeeModal from '../components/AddEmployeeModal';
import EditEmployeeModal from '../components/EditEmployeeModal';
import { getImageUrl } from '../utils/imageUtils';

const MembersDirectory: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'departments' | 'members'>('members');
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
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

    // Get unique departments with counts
    const departments = React.useMemo(() => {
        if (!users) return [];
        const activeUsers = users.filter(u => u.accountState === 'ACTIVE');
        const deptMap = new Map<string, number>();
        
        activeUsers.forEach(user => {
            const count = deptMap.get(user.department) || 0;
            deptMap.set(user.department, count + 1);
        });
        
        return Array.from(deptMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [users]);

    const handleDepartmentClick = (departmentName: string) => {
        setSelectedDepartment(departmentName);
        setViewMode('members');
        setFilter(departmentName);
    };

    const handleBackToDepartments = () => {
        setViewMode('departments');
        setSelectedDepartment(null);
        setFilter('all');
    };


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
        navigate(`/messages/${userId}`);
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
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0 pt-0 md:pt-16">
            {/* Page Header */}
            <header className="p-4 md:p-8 bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {viewMode === 'members' && selectedDepartment && (
                            <button
                                onClick={handleBackToDepartments}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                                aria-label="Back to departments"
                            >
                                <FaArrowLeft className="text-xl text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl md:text-3xl font-semibold text-gray-900 dark:text-dark-text mb-1 md:mb-2 truncate">
                                {selectedDepartment || 'Employees'}
                            </h1>
                            <p className="text-sm md:text-base text-gray-600 dark:text-dark-muted line-clamp-1">
                                {selectedDepartment 
                                    ? `All members in ${selectedDepartment}` 
                                    : viewMode === 'departments'
                                        ? 'Browse by department'
                                        : 'All employees'
                                }
                            </p>
                        </div>
                    </div>
                    
                    {/* View Toggle */}
                    <nav className="flex flex-row items-center gap-2 flex-shrink-0 w-full md:w-auto" aria-label="View mode toggle">
                        <button
                            onClick={() => {
                                setViewMode('members');
                                setFilter('all');
                                setSelectedDepartment(null);
                            }}
                            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${
                                viewMode === 'members'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            aria-pressed={viewMode === 'members'}
                        >
                            <FaList className="text-xs md:text-sm flex-shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">All Members</span>
                            <span className="sm:hidden">Members</span>
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('departments');
                                setSelectedDepartment(null);
                                setFilter('all');
                            }}
                            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${
                                viewMode === 'departments'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            aria-pressed={viewMode === 'departments'}
                        >
                            <FaTh className="text-xs md:text-sm flex-shrink-0" aria-hidden="true" />
                            <span>Departments</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Department Cards View */}
            {viewMode === 'departments' && (
                <div className="p-8">
                    {departments.length === 0 && (
                        <div className="text-center py-12">
                            <FaUsers className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-dark-muted mb-4">No departments found</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {departments.map((dept) => {
                            return (
                            <div
                                key={dept.name}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDepartmentClick(dept.name);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleDepartmentClick(dept.name);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                className="bg-white dark:bg-dark-paper rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <FaUsers className="text-2xl text-primary" />
                                    </div>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold">
                                        {dept.count} {dept.count === 1 ? 'employee' : 'employees'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
                                    {dept.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-dark-muted">
                                    Click to view all members
                                </p>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Members View */}
            {viewMode === 'members' && (
                <div className="p-8">
                    {/* Quick Filters (when viewing members) */}
                    {!selectedDepartment && (
                        <div className="mb-3 md:mb-6">
                            <div className="flex gap-1.5 md:gap-3 flex-wrap">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-1.5 py-1 md:px-4 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-sm font-medium transition-all ${
                                        filter === 'all'
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-dark-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary'
                                    }`}
                                >
                                    All Employees
                                </button>
                                {departments.map((dept) => (
                                    <button
                                        key={dept.name}
                                        onClick={() => setFilter(dept.name)}
                                        className={`px-1.5 py-1 md:px-4 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-sm font-medium transition-all ${
                                            filter === dept.name
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-dark-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary'
                                        }`}
                                    >
                                        {dept.name} ({dept.count})
                                    </button>
                                ))}
                                <button
                                    onClick={() => setFilter('online')}
                                    className={`px-1.5 py-1 md:px-4 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-sm font-medium transition-all ${
                                        filter === 'online'
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-dark-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary'
                                    }`}
                                >
                                    Online Only
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {filteredUsers?.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => navigate(`/members/${user.id}`)}
                            className="bg-white dark:bg-dark-paper rounded-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            {/* Card Header */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 mb-3 md:mb-4">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    {(() => {
                                        const profilePictureUrl = getImageUrl(user.profilePicture);
                                        return profilePictureUrl ? (
                                            <img
                                                src={profilePictureUrl}
                                                alt={user.name}
                                                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover"
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
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-base md:text-lg" style={{ display: user.profilePicture ? 'none' : 'flex' }}>
                                        {user.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    {user.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 md:border-3 border-white dark:border-dark-paper"></div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 text-center md:text-left w-full">
                                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-dark-text truncate mb-0.5 md:mb-1">
                                        {user.name}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-600 dark:text-dark-muted truncate mb-0.5">
                                        {user.jobTitle}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1 md:mb-0">
                                        {user.department}
                                    </p>
                                    <span
                                        className={`inline-block mt-1 md:mt-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold ${
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
                            <div className="flex gap-1.5 md:gap-2 pt-2 md:pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={(e) => handleMessage(e, user.id)}
                                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-primary hover:bg-primary-dark text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
                                >
                                    <FaComment className="text-xs" />
                                    <span className="hidden sm:inline">Message</span>
                                </button>
                                <button
                                    onClick={(e) => handleView(e, user.id)}
                                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs md:text-sm font-medium rounded-lg transition-colors"
                                >
                                    <FaEye className="text-xs" />
                                    <span className="hidden sm:inline">View</span>
                                </button>
                                {currentUser?.role === 'SUPER_ADMIN' && (
                                    <>
                                        <button
                                            onClick={(e) => handleEdit(e, user)}
                                            className="px-2 md:px-3 py-1.5 md:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-primary rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <FaEdit className="text-xs md:text-sm" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeactivate(e, user)}
                                            className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors ${
                                                user.accountState === 'ACTIVE'
                                                    ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500'
                                                    : 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-500'
                                            }`}
                                            title={user.accountState === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                        >
                                            {user.accountState === 'ACTIVE' ? <FaBan className="text-xs md:text-sm" /> : <FaCheck className="text-xs md:text-sm" />}
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
                            <p className="text-gray-600 dark:text-dark-muted mb-4">
                                {selectedDepartment 
                                    ? `No members found in ${selectedDepartment}` 
                                    : 'No members found'}
                            </p>
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
            )}

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
