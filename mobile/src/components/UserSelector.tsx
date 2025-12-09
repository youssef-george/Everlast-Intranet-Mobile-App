import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../services/api';
import type { User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface UserSelectorProps {
    onSelect: (userId: string) => void;
    currentUserId?: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onSelect, currentUserId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            try {
                const response = await api.get<User[]>('/users?includeDeactivated=true');
                return response.data;
            } catch (err: any) {
                if (err.code !== 'ERR_NETWORK' && 
                    err.code !== 'ECONNREFUSED' && 
                    err.response?.status !== 404) {
                    console.error('Failed to fetch users:', err);
                }
                throw err;
            }
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    const isConnectionError = error && (
        (error as any)?.code === 'ERR_NETWORK' ||
        (error as any)?.code === 'ECONNREFUSED' ||
        (error as any)?.response?.status === 404
    );

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (userId: string) => {
        onSelect(userId);
        setSearchQuery('');
    };

    const renderUser = ({ item: user }: { item: User }) => {
        const isSelected = currentUserId === user.id;
        const profilePictureUrl = user.profilePicture 
            ? (user.profilePicture.startsWith('http') 
                ? user.profilePicture 
                : `http://10.0.2.2:3001${user.profilePicture}`)
            : null;

        return (
            <TouchableOpacity
                style={[styles.userItem, isSelected && styles.userItemSelected]}
                onPress={() => handleSelect(user.id)}
            >
                {profilePictureUrl ? (
                    <Image
                        source={{ uri: profilePictureUrl }}
                        style={styles.avatar}
                    />
                ) : (
                    <Icon name="account-circle" size={48} color={styles.icon.color} />
                )}
                <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{user.name}</Text>
                        {isSelected && (
                            <Icon name="check-circle" size={20} color="#005d99" />
                        )}
                    </View>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userTags}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{user.role}</Text>
                        </View>
                        {user.accountState === 'DEACTIVATED' && (
                            <View style={[styles.tag, styles.tagDanger]}>
                                <Text style={[styles.tagText, styles.tagDangerText]}>Deactivated</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.modal}>
                <View style={styles.header}>
                    <Text style={styles.title}>Select User</Text>
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20} color={styles.icon.color} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search users..."
                            placeholderTextColor={styles.placeholder.color}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>
                </View>

                <View style={styles.content}>
                    {error ? (
                        <View style={styles.errorContainer}>
                            {isConnectionError ? (
                                <>
                                    <Text style={styles.errorTitle}>⚠️ Backend Server Not Running</Text>
                                    <Text style={styles.errorText}>Unable to connect to backend server</Text>
                                    <Text style={styles.errorInstructions}>
                                        To start the backend server:{'\n'}
                                        1. Open terminal in backend folder{'\n'}
                                        2. Run: npm run start:dev{'\n'}
                                        3. Wait for server to start on port 3001{'\n'}
                                        4. Refresh this screen
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.errorTitle}>⚠️ Error Loading Users</Text>
                                    <Text style={styles.errorText}>
                                        {(error as any)?.response?.data?.message || 
                                         (error as any)?.message || 
                                         'An error occurred while loading users'}
                                    </Text>
                                </>
                            )}
                        </View>
                    ) : isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#005d99" />
                            <Text style={styles.loadingText}>Loading users...</Text>
                        </View>
                    ) : filteredUsers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            renderItem={renderUser}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modal: {
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? '#333333' : '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: theme === 'dark' ? '#ffffff' : '#000000',
    },
    icon: {
        color: theme === 'dark' ? '#ffffff' : '#000000',
    },
    placeholder: {
        color: theme === 'dark' ? '#888888' : '#999999',
    },
    content: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? '#333333' : '#e0e0e0',
    },
    userItemSelected: {
        backgroundColor: theme === 'dark' ? 'rgba(0, 93, 153, 0.2)' : 'rgba(0, 93, 153, 0.1)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        marginRight: 8,
    },
    userEmail: {
        fontSize: 14,
        color: theme === 'dark' ? '#aaaaaa' : '#666666',
        marginBottom: 4,
    },
    userTags: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        backgroundColor: theme === 'dark' ? '#333333' : '#e0e0e0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 12,
        color: theme === 'dark' ? '#cccccc' : '#666666',
    },
    tagDanger: {
        backgroundColor: theme === 'dark' ? '#4a1a1a' : '#fee',
    },
    tagDangerText: {
        color: theme === 'dark' ? '#ff6b6b' : '#c00',
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: theme === 'dark' ? '#aaaaaa' : '#666666',
    },
    errorContainer: {
        padding: 32,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ff6b6b',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: theme === 'dark' ? '#aaaaaa' : '#666666',
        marginBottom: 16,
    },
    errorInstructions: {
        fontSize: 12,
        color: theme === 'dark' ? '#888888' : '#999999',
        lineHeight: 20,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: theme === 'dark' ? '#aaaaaa' : '#666666',
    },
});

export default UserSelector;

