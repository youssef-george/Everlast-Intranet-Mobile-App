import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
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

        // Use current hostname for Socket.IO to support network access
        const getSocketURL = () => {
            // In production (when served from backend), use relative URLs
            if (typeof window !== 'undefined') {
                const isProduction = import.meta.env.PROD;
                
                if (isProduction) {
                    // In production, frontend is served from backend, so use relative URLs
                    return window.location.origin;
                }
                
                // Development mode - use hostname-based URL for network access
                const hostname = window.location.hostname;
                if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                    return `http://${hostname}:3001`;
                }
            }
            return 'http://localhost:3001';
        };

        const newSocket = io(getSocketURL(), {
            query: { userId: currentUser.id },
            transports: ['websocket', 'polling'], // Add polling fallback for Safari compatibility
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
