import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Get socket URL based on platform
        const getSocketURL = () => {
            if (__DEV__) {
                if (Platform.OS === 'android') {
                    // Android emulator uses 10.0.2.2 to access host machine's localhost
                    return 'http://10.0.2.2:3001';
                } else if (Platform.OS === 'ios') {
                    // iOS simulator can use localhost
                    return 'http://localhost:3001';
                }
            }
            
            // Production - update this to your production backend URL
            return 'http://localhost:3001';
        };

        const newSocket = io(getSocketURL(), {
            query: { userId: currentUser.id },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected, userId:', currentUser.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [currentUser?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

// Safe version that returns null if context is not available
export const useSocketSafe = () => {
    const context = useContext(SocketContext);
    return context || { socket: null, isConnected: false };
};

