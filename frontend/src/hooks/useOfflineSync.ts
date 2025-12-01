import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import {
    queueMessage,
    getQueuedMessages,
    removeQueuedMessage,
    cacheMessage,
    getCachedMessages,
} from '../utils/offlineCache';

export const useOfflineSync = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queuedCount, setQueuedCount] = useState(0);
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncQueuedMessages();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check queued messages on mount
        checkQueuedMessages();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const checkQueuedMessages = async () => {
        try {
            const queued = await getQueuedMessages();
            setQueuedCount(queued.length);
        } catch (error) {
            console.error('Error checking queued messages:', error);
        }
    };

    const syncQueuedMessages = async () => {
        if (!socket || !isOnline) return;

        try {
            const queued = await getQueuedMessages();
            
            for (const message of queued) {
                try {
                    // Try to send the message
                    socket.emit('sendMessage', message.data);
                    
                    // Remove from queue if successful
                    await removeQueuedMessage(message.id);
                    setQueuedCount((prev) => Math.max(0, prev - 1));
                } catch (error) {
                    console.error('Error syncing message:', error);
                    // Keep in queue for next sync attempt
                }
            }
        } catch (error) {
            console.error('Error syncing queued messages:', error);
        }
    };

    const handleOfflineMessage = async (messageData: any) => {
        if (!isOnline) {
            // Queue message for later
            await queueMessage({ data: messageData });
            setQueuedCount((prev) => prev + 1);
            return false; // Indicate message was queued
        }
        return true; // Indicate message can be sent
    };

    return {
        isOnline,
        queuedCount,
        handleOfflineMessage,
        syncQueuedMessages,
    };
};

