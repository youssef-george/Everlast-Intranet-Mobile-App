import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaLink, FaPlus, FaEdit, FaTrash, FaTimes, FaSave } from 'react-icons/fa';
import api from '../services/api';
import type { QuickLink } from '../types';
import { useAuth } from '../context/AuthContext';

const QuickLinks: React.FC = () => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newLink, setNewLink] = useState({ name: '', url: '' });
    const [editLink, setEditLink] = useState({ name: '', url: '' });

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const { data: quickLinks = [], isLoading } = useQuery({
        queryKey: ['quick-links'],
        queryFn: async () => {
            const response = await api.get<QuickLink[]>('/quick-links');
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; url: string }) => {
            return api.post('/quick-links', {
                ...data,
                requesterId: currentUser?.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quick-links'] });
            setIsAdding(false);
            setNewLink({ name: '', url: '' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name: string; url: string } }) => {
            return api.patch(`/quick-links/${id}`, {
                ...data,
                requesterId: currentUser?.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quick-links'] });
            setEditingId(null);
            setEditLink({ name: '', url: '' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/quick-links/${id}`, {
                data: { requesterId: currentUser?.id },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quick-links'] });
        },
    });

    const handleAdd = () => {
        if (newLink.name && newLink.url) {
            createMutation.mutate(newLink);
        }
    };

    const handleEdit = (link: QuickLink) => {
        setEditingId(link.id);
        setEditLink({ name: link.name, url: link.url });
    };

    const handleSave = (id: string) => {
        if (editLink.name && editLink.url) {
            updateMutation.mutate({ id, data: editLink });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this link?')) {
            deleteMutation.mutate(id);
        }
    };

    const formatUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
                    <FaLink className="text-primary" />
                    Quick Links
                </h3>
                {isSuperAdmin && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                    >
                        <FaPlus className="text-xs" />
                        Add
                    </button>
                )}
            </div>

            {isAdding && isSuperAdmin && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                        type="text"
                        placeholder="Link Name"
                        value={newLink.name}
                        onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                        className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-paper text-gray-900 dark:text-dark-text focus:outline-none focus:border-primary"
                    />
                    <input
                        type="text"
                        placeholder="URL (e.g., example.com or https://example.com)"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-paper text-gray-900 dark:text-dark-text focus:outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={createMutation.isPending}
                            className="flex-1 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            <FaSave className="text-xs" />
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewLink({ name: '', url: '' });
                            }}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                        >
                            <FaTimes className="text-xs" />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {quickLinks.length === 0 && !isAdding && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        {isSuperAdmin ? 'No quick links yet. Add one to get started!' : 'No quick links available.'}
                    </p>
                )}
                {quickLinks.map((link) => (
                    <div
                        key={link.id}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        {editingId === link.id && isSuperAdmin ? (
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    value={editLink.name}
                                    onChange={(e) => setEditLink({ ...editLink, name: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-paper text-gray-900 dark:text-dark-text focus:outline-none focus:border-primary"
                                />
                                <input
                                    type="text"
                                    value={editLink.url}
                                    onChange={(e) => setEditLink({ ...editLink, url: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-paper text-gray-900 dark:text-dark-text focus:outline-none focus:border-primary"
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleSave(link.id)}
                                        disabled={updateMutation.isPending}
                                        className="px-2 py-1 bg-primary hover:bg-primary-dark text-white text-xs rounded transition-colors disabled:opacity-50"
                                    >
                                        <FaSave />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
                                            setEditLink({ name: '', url: '' });
                                        }}
                                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <a
                                    href={formatUrl(link.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-0"
                                    title={`${link.name} - ${link.url}`}
                                >
                                    <div className="text-xs font-medium text-gray-900 dark:text-dark-text truncate">
                                        {link.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                        {link.url}
                                    </div>
                                </a>
                                {isSuperAdmin && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(link)}
                                            className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <FaEdit className="text-xs" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id)}
                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuickLinks;

