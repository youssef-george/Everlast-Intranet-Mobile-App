import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaUsers } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { User } from '../types';

interface SearchResults {
    users: User[];
    groups: Array<{
        id: string;
        name: string;
        picture?: string;
    }>;
}

const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: results, isLoading } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return null;
            const response = await api.get<SearchResults>(`/search?q=${encodeURIComponent(debouncedQuery)}`);
            return response.data;
        },
        enabled: debouncedQuery.length > 0,
    });

    const handleResultClick = (type: 'user' | 'group', id: string) => {
        setShowResults(false);
        setQuery('');
        
        if (type === 'user') {
            navigate(`/members/${id}`);
        } else if (type === 'group') {
            navigate(`/groups/${id}`);
        }
    };

    return (
        <div ref={searchRef} className="relative w-full">
            <div className="relative">
                <FaSearch className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#6b7280] text-sm" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search employees, message"
                    className="w-full h-9 md:h-10 pl-10 md:pl-11 pr-3 md:pr-4 rounded-[20px] border border-[#e5e5e5] bg-[#f5f5f5] text-sm text-gray-900 dark:text-dark-text placeholder:text-[#6b7280] focus:outline-none focus:border-[#005d99] focus:bg-white dark:focus:bg-gray-700 transition-colors"
                />
            </div>

            {/* Search Results Dropdown */}
            {showResults && query.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-paper rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Searching...
                        </div>
                    ) : results ? (
                        <>
                            {/* Users Section */}
                            {results.users && results.users.length > 0 && (
                                <div className="border-b border-gray-100 dark:border-gray-700">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Employees
                                    </div>
                                    {results.users.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleResultClick('user', user.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                        >
                                            <FaUser className="text-primary text-sm" />
                                            {user.profilePicture ? (
                                                <img
                                                    src={user.profilePicture}
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {user.jobTitle} • {user.department}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Groups Section */}
                            {results.groups && results.groups.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Groups
                                    </div>
                                    {results.groups.map((group) => (
                                        <button
                                            key={group.id}
                                            onClick={() => handleResultClick('group', group.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                        >
                                            <FaUsers className="text-accent text-sm" />
                                            {group.picture ? (
                                                <img
                                                    src={group.picture}
                                                    alt={group.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                                    <FaUsers className="text-sm text-gray-600 dark:text-gray-300" />
                                                </div>
                                            )}
                                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                                                {group.name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No Results */}
                            {(!results.users || results.users.length === 0) &&
                                (!results.groups || results.groups.length === 0) && (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                        No results found for "{query}"
                                    </div>
                                )}
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SearchBar;

