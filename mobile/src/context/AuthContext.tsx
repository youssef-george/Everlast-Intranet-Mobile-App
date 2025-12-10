import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import api from '../services/api';

interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isLoading: boolean;
    loginAs: (userId: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    showUserSelector: boolean;
    setShowUserSelector: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showUserSelector, setShowUserSelector] = useState(false);

    useEffect(() => {
        // Check AsyncStorage for saved user
        const loadSavedUser = async () => {
            try {
                const savedUserId = await AsyncStorage.getItem('currentUserId');
                if (savedUserId) {
                    await loginAs(savedUserId);
                } else {
                    setIsLoading(false);
                    setShowUserSelector(true);
                }
            } catch (error) {
                console.error('Error loading saved user:', error);
                setIsLoading(false);
                setShowUserSelector(true);
            }
        };

        loadSavedUser();
    }, []);

    const loginAs = async (userId: string) => {
        try {
            setIsLoading(true);
            const response = await api.get(`/users/${userId}`);
            const user = response.data;
            
            // Don't allow deactivated users to login
            if (user.accountState === 'DEACTIVATED') {
                throw new Error('This account is deactivated');
            }

            setCurrentUser(user);
            await AsyncStorage.setItem('currentUserId', userId);
            setShowUserSelector(false);

            // Set online status
            await api.patch(`/users/${userId}/online-status`, { isOnline: true });
        } catch (error) {
            console.error('Login failed', error);
            await AsyncStorage.removeItem('currentUserId');
            setShowUserSelector(true);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        if (currentUser) {
            try {
                const response = await api.get(`/users/${currentUser.id}`);
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Failed to refresh user', error);
            }
        }
    };

    const logout = async () => {
        if (currentUser) {
            try {
                await api.patch(`/users/${currentUser.id}/online-status`, { isOnline: false });
            } catch (error) {
                console.error('Logout error', error);
            }
        }
        setCurrentUser(null);
        await AsyncStorage.removeItem('currentUserId');
        setShowUserSelector(true);
    };

    return (
        <AuthContext.Provider value={{ 
            currentUser, 
            setCurrentUser, 
            isLoading, 
            loginAs, 
            logout,
            refreshUser,
            showUserSelector,
            setShowUserSelector
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


