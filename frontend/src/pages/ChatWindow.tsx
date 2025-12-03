import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { FaArrowLeft, FaPaperPlane, FaPaperclip, FaSmile, FaMicrophone, FaUserCircle, FaEllipsisV, FaPhone, FaUsers, FaTimes, FaTrash } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import api from '../services/api';
import type { Message, User, Group } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MessageBubble from '../components/MessageBubble';
import VoiceRecorder from '../components/VoiceRecorder';

interface ChatWindowProps {
    isGroup?: boolean;
    chatId?: string; // Optional prop to override route param
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isGroup = false, chatId: propChatId }) => {
    const { id: routeId } = useParams<{ id: string }>();
    const id = propChatId || routeId; // Use prop if provided, otherwise use route param
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingEmitRef = useRef<number>(0);
    const lastStopTypingEmitRef = useRef<number>(0);
    const isTypingRef = useRef<boolean>(false);

    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardSearchQuery, setForwardSearchQuery] = useState('');
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [recordingMode, setRecordingMode] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [showContactPopup, setShowContactPopup] = useState(false);
    const pendingMessagesRef = useRef<Map<string, string>>(new Map()); // tempId -> content mapping

    // Fetch chat partner or group info
    const { data: chatInfo, isLoading: isLoadingChatInfo } = useQuery({
        queryKey: [isGroup ? 'group' : 'user', id],
        queryFn: async () => {
            if (!id) throw new Error('Chat ID is required');
            const endpoint = isGroup ? `/groups/${id}` : `/users/${id}`;
            const response = await api.get<User | Group>(endpoint);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch messages - increased limit to load more old messages
    const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
        queryKey: ['messages', id, isGroup],
        queryFn: async () => {
            if (!id || !currentUser?.id) throw new Error('Chat ID and user ID are required');
            console.log('🔄 Fetching messages from server:', { id, isGroup, userId: currentUser.id });
            const endpoint = isGroup
                ? `/chat/group/${id}/messages?limit=1000`
                : `/chat/messages/${currentUser.id}/${id}?limit=1000`;
            const response = await api.get<Message[]>(endpoint);
            const filtered = response.data.filter((msg) => {
                // Filter out messages deleted for current user
                if (msg.deletedFor) {
                    const deletedFor = JSON.parse(msg.deletedFor);
                    return !deletedFor.includes(currentUser.id);
                }
                return !msg.isDeleted || msg.senderId === currentUser.id;
            });
            console.log(`✅ Fetched ${filtered.length} messages from server`);
            return filtered;
        },
        enabled: !!currentUser && !!id,
        refetchOnMount: 'always', // Always refetch when component mounts
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchInterval: false, // Disable polling - we use socket for real-time updates
        staleTime: 0, // Always consider data stale to refetch when chat changes
    });

    // Messages automatically refetch when chat changes due to queryKey including 'id'
    // and refetchOnMount: 'always' - no manual refetch needed

    // Mark chat as read when opening/viewing
    useEffect(() => {
        if (!socket || !currentUser || !id) return;

        // Mark all messages in this chat as read
        socket.emit('markChatAsRead', {
            chatId: id,
            userId: currentUser.id,
            isGroup,
        });
    }, [socket, currentUser, id, isGroup]);

    // Handle ESC key to exit chat
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle ESC when ChatWindow is used as a standalone route (mobile)
            // On desktop, MessagesPage handles ESC to clear selectedChatId
            if (event.key === 'Escape' && !propChatId && id) {
                // Navigate back to messages page
                navigate('/messages');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [id, propChatId, navigate]);

    // Scroll to bottom on new messages or when chat changes
    useEffect(() => {
        if (messages.length > 0) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
        }
    }, [messages, id]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        // Handler for message save confirmation (sender only)
        const handleMessageSaved = (message: Message) => {
            console.log('✅ Received messageSaved confirmation:', {
                messageId: message.id,
                content: message.content?.substring(0, 50),
                senderId: message.senderId,
            });

            // This is confirmation that OUR message was saved
            // Replace optimistic message with real one
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) => {
                // Find optimistic message by sender and timestamp proximity
                const now = new Date(message.createdAt).getTime();
                const optimisticIndex = old.findIndex(m => 
                    m.id.startsWith('temp-') && 
                    m.senderId === currentUser?.id &&
                    Math.abs(new Date(m.createdAt).getTime() - now) < 5000 // Within 5 seconds
                );
                
                if (optimisticIndex >= 0) {
                    console.log('🔄 Replacing optimistic message with real message');
                    const newMessages = [...old];
                    newMessages[optimisticIndex] = message;
                    // Clear pending reference
                    const contentKey = message.content || '';
                    pendingMessagesRef.current.delete(contentKey);
                    return newMessages;
                }
                
                // No optimistic message found, check if message already exists
                const exists = old.some(m => m.id === message.id);
                if (exists) {
                    console.log('⏭️ Message already exists in cache');
                    return old;
                }
                
                // Add as new message (shouldn't normally happen)
                console.log('➕ Adding message to cache (no optimistic found)');
                return [...old, message];
            });
        };

        // Handler for new messages from other users (receiver only)
        const handleNewMessage = (message: Message) => {
            // For individual chats: message belongs to this chat if:
            // - sender is chat partner (id) AND receiver is current user, OR
            // - sender is current user AND receiver is current user (self-chat)
            const isIndividualChatMatch = !isGroup && (
                (message.senderId === id && message.receiverId === currentUser?.id) ||
                (message.senderId === currentUser?.id && message.receiverId === currentUser?.id && id === currentUser?.id)
            );
            
            // For group chats: message belongs to this chat if groupId matches
            const isGroupChatMatch = isGroup && message.groupId === id;
            
            const matchesChat = isIndividualChatMatch || isGroupChatMatch;
            
            console.log('📨 Received newMessage event:', {
                messageId: message.id,
                content: message.content?.substring(0, 50),
                senderId: message.senderId,
                receiverId: message.receiverId,
                groupId: message.groupId,
                currentChatId: id,
                isGroup,
                currentUserId: currentUser?.id,
                matchesChat
            });
            
            if (matchesChat) {
                console.log('✅ Message matches this chat, adding to query cache');
                queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) => {
                    // Check if message already exists by real ID
                    const existsById = old.some(m => m.id === message.id);
                    if (existsById) {
                        console.log('⏭️ Message already exists in cache');
                        return old;
                    }
                    
                    // Add new message from other user
                    console.log('➕ Adding new message to cache');
                    return [...old, message];
                });
                
                // Mark as delivered and seen since we're viewing this chat
                console.log('✓ Marking message as delivered and seen');
                socket.emit('messageDelivered', { messageId: message.id });
                socket.emit('messageSeen', { messageId: message.id });
            }
        };

        const handleMessageSent = (message: Message) => {
            // Legacy handler - kept for backward compatibility
            // The new flow uses 'messageSaved' instead
            console.log('📤 Received messageSent event (legacy):', message.id);
            if (
                (isGroup && message.groupId === id) ||
                (!isGroup && (message.senderId === id || message.receiverId === id))
            ) {
                queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) => {
                    const exists = old.some(m => m.id === message.id);
                    if (exists) return old;
                    return [...old, message];
                });
            }
        };

        const handleTyping = (data: { userId: string; chatId: string; isGroup: boolean }) => {
            console.log('📝 Received typing event:', data, 'Current chat id:', id, 'isGroup:', isGroup, 'Current user:', currentUser?.id);
            // Don't show typing indicator for own typing
            if (data.userId === currentUser?.id) {
                console.log('⏭️ Ignoring own typing event');
                return;
            }
            
            // For individual chats: 
            // - id is the chat partner's ID (the person we're chatting with)
            // - data.userId is the person who is typing
            // - data.chatId is the recipient's ID (us, the current user)
            // So we match if: the typing user (data.userId) is our chat partner (id)
            // OR if the chatId in the event is our user ID (meaning they're typing to us)
            const isTypingFromCurrentChat = isGroup 
                ? (data.chatId === id && data.isGroup)
                : (data.userId === id || data.chatId === currentUser?.id);
            
            if (isTypingFromCurrentChat) {
                console.log('✅ Typing event matches this chat, adding user:', data.userId);
                setTypingUsers((prev) => {
                    if (!prev.includes(data.userId)) {
                        return [...prev, data.userId];
                    }
                    return prev;
                });
            } else {
                console.log('❌ Typing event does not match this chat', {
                    'data.userId === id': data.userId === id,
                    'data.chatId === currentUser.id': data.chatId === currentUser?.id,
                    'data.userId': data.userId,
                    'id': id,
                    'data.chatId': data.chatId,
                    'currentUser.id': currentUser?.id
                });
            }
        };

        const handleStopTyping = (data: { userId: string; chatId: string; isGroup: boolean }) => {
            // Don't process own stop typing events
            if (data.userId === currentUser?.id) {
                return;
            }
            
            // For individual chats: check if the typing user is the person we're chatting with
            const isTypingFromCurrentChat = isGroup 
                ? (data.chatId === id && data.isGroup)
                : (data.userId === id || data.chatId === currentUser?.id);
            
            if (isTypingFromCurrentChat) {
                console.log('🛑 Removing typing user:', data.userId);
                setTypingUsers((prev) => prev.filter((uid) => uid !== data.userId));
            }
        };

        const handleMessageStatusUpdate = (data: { messageId: string; status: string }) => {
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) =>
                old.map((msg) =>
                    msg.id === data.messageId
                        ? {
                              ...msg,
                              deliveredAt: data.status === 'delivered' ? new Date().toISOString() : msg.deliveredAt,
                              seenAt: data.status === 'seen' ? new Date().toISOString() : msg.seenAt,
                          }
                        : msg
                )
            );
        };

        const handleReactionAdded = (data: { messageId: string; reaction: any }) => {
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) =>
                old.map((msg) =>
                    msg.id === data.messageId
                        ? {
                              ...msg,
                              reactions: [...(msg.reactions || []), data.reaction],
                          }
                        : msg
                )
            );
        };

        const handleReactionRemoved = (data: { messageId: string; userId: string; emoji: string }) => {
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) =>
                old.map((msg) =>
                    msg.id === data.messageId
                        ? {
                              ...msg,
                              reactions: (msg.reactions || []).filter(
                                  (r) => !(r.userId === data.userId && r.emoji === data.emoji)
                              ),
                          }
                        : msg
                )
            );
        };

        const handleMessageDeleted = (data: { messageId: string }) => {
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) =>
                old.map((msg) =>
                    msg.id === data.messageId ? { ...msg, isDeleted: true } : msg
                )
            );
        };

        const handleMessageError = (data: { error: string; details?: string }) => {
            console.error('❌ Message error received:', data);
            // Remove any pending optimistic messages
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) =>
                old.filter(m => !m.id.startsWith('temp-'))
            );
            // Clear pending messages map
            pendingMessagesRef.current.clear();
            // Show error to user
            alert(`Failed to send message: ${data.error}\n${data.details || ''}`);
        };

        // Register socket event listeners
        socket.on('messageSaved', handleMessageSaved);  // Sender confirmation
        socket.on('newMessage', handleNewMessage);      // Receiver notification
        socket.on('messageError', handleMessageError);  // Error handling
        socket.on('messageSent', handleMessageSent);    // Legacy support
        socket.on('userTyping', handleTyping);
        socket.on('userStoppedTyping', handleStopTyping);
        socket.on('messageStatusUpdate', handleMessageStatusUpdate);
        socket.on('reactionAdded', handleReactionAdded);
        socket.on('reactionRemoved', handleReactionRemoved);
        socket.on('messageDeleted', handleMessageDeleted);

        return () => {
            socket.off('messageSaved', handleMessageSaved);
            socket.off('newMessage', handleNewMessage);
            socket.off('messageError', handleMessageError);
            socket.off('messageSent', handleMessageSent);
            socket.off('userTyping', handleTyping);
            socket.off('userStoppedTyping', handleStopTyping);
            socket.off('messageStatusUpdate', handleMessageStatusUpdate);
            socket.off('reactionAdded', handleReactionAdded);
            socket.off('reactionRemoved', handleReactionRemoved);
            socket.off('messageDeleted', handleMessageDeleted);
        };
    }, [socket, id, isGroup, queryClient, currentUser]);

    // Typing indicator with proper debouncing
    useEffect(() => {
        if (!socket || !currentUser || !id || !socket.connected) {
            return;
        }

        // Clear previous debounce timeout
        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
        }

        // Clear previous stop typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (newMessage.trim().length > 0) {
            // Debounce typing events - only emit every 1 second
            const now = Date.now();
            const timeSinceLastEmit = now - lastTypingEmitRef.current;
            
            if (timeSinceLastEmit > 1000) {
                // Emit typing event
                const typingData = { userId: currentUser.id, chatId: id, isGroup };
                socket.emit('typing', typingData);
                lastTypingEmitRef.current = now;
                setIsTyping(true);
                isTypingRef.current = true;
            } else {
                // Schedule emit after debounce period
                typingDebounceRef.current = setTimeout(() => {
                    const typingData = { userId: currentUser.id, chatId: id, isGroup };
                    socket.emit('typing', typingData);
                    lastTypingEmitRef.current = Date.now();
                    setIsTyping(true);
                    isTypingRef.current = true;
                }, 1000 - timeSinceLastEmit);
            }

            // Set timeout to stop typing after 3 seconds of no changes
            typingTimeoutRef.current = setTimeout(() => {
                if (isTypingRef.current) {
                    const typingData = { userId: currentUser.id, chatId: id, isGroup };
                    socket.emit('stopTyping', typingData);
                    setIsTyping(false);
                    isTypingRef.current = false;
                    lastStopTypingEmitRef.current = Date.now();
                }
            }, 3000);
        } else {
            // If message is empty and we were typing, stop typing (only emit once per second)
            if (isTypingRef.current) {
                const now = Date.now();
                const timeSinceLastStopEmit = now - lastStopTypingEmitRef.current;
                if (timeSinceLastStopEmit > 1000) {
                    const typingData = { userId: currentUser.id, chatId: id, isGroup };
                    socket.emit('stopTyping', typingData);
                    setIsTyping(false);
                    isTypingRef.current = false;
                    lastTypingEmitRef.current = 0;
                    lastStopTypingEmitRef.current = now;
                }
            }
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (typingDebounceRef.current) {
                clearTimeout(typingDebounceRef.current);
            }
        };
    }, [newMessage, socket, currentUser, id, isGroup]);

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        // Stop typing indicator when sending
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socket?.emit('stopTyping', { userId: currentUser.id, chatId: id, isGroup });
        setIsTyping(false);

        const messageData = {
            content: newMessage.trim(),
            senderId: currentUser.id,
            [isGroup ? 'groupId' : 'receiverId']: id,
            replyToId: replyTo?.id,
        };

        // Optimistic update - add message immediately to UI
        const tempId = `temp-${Date.now()}`;
        const contentKey = messageData.content;
        pendingMessagesRef.current.set(contentKey, tempId);
        
        const optimisticMessage: Message = {
            id: tempId,
            content: messageData.content,
            senderId: currentUser.id,
            receiverId: isGroup ? undefined : id,
            groupId: isGroup ? id : undefined,
            replyToId: replyTo?.id,
            isPinned: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sender: currentUser,
            replyTo: replyTo || undefined,
            deliveredAt: null,
            seenAt: null,
        };

        queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) => [...old, optimisticMessage]);
        setNewMessage('');
        setReplyTo(null);
        setShowEmojiPicker(false);

        // Send message with timeout and acknowledgment
        if (!socket) {
            console.error('❌ Socket not connected');
            alert('Connection error. Please check your internet connection.');
            // Remove optimistic message
            pendingMessagesRef.current.delete(contentKey);
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) =>
                old.filter((m) => m.id !== tempId)
            );
            return;
        }

        try {
            console.log('📤 Sending message via socket:', messageData);
            
            // Create promise with timeout for message send
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.error('⏱️ Message send timeout');
                    reject(new Error('Message send timeout after 10 seconds'));
                }, 10000); // 10 second timeout

                // Set up one-time listeners for this specific message
                const handleSuccess = (message: any) => {
                    if (message.senderId === currentUser.id && 
                        (message.content === contentKey || message.id)) {
                        clearTimeout(timeout);
                        console.log('✅ Message send confirmed');
                        resolve();
                    }
                };

                const handleError = (data: any) => {
                    clearTimeout(timeout);
                    console.error('❌ Message send error:', data);
                    reject(new Error(data.error || 'Failed to send message'));
                };

                // Listen for confirmation or error
                socket.once('messageSaved', handleSuccess);
                socket.once('messageError', handleError);

                // Send the message
                socket.emit('sendMessage', messageData, (response: any) => {
                    // Callback-based acknowledgment (if supported)
                    if (response && !response.success) {
                        clearTimeout(timeout);
                        reject(new Error(response.error || 'Failed to send message'));
                    }
                });
            });

            console.log('✅ Message sent successfully');
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            
            // Remove optimistic message on error
            pendingMessagesRef.current.delete(contentKey);
            queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) =>
                old.filter((m) => m.id !== tempId)
            );

            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to send message: ${errorMessage}\n\nThe message was not delivered. Please try again.`);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        try {
            // Upload file - backend will create message if messageId is 'temp'
            const formData = new FormData();
            formData.append('file', file);
            formData.append('messageId', 'temp'); // Backend will create message
            formData.append('senderId', currentUser.id);
            if (isGroup) {
                formData.append('groupId', id);
            } else {
                formData.append('receiverId', id);
            }

            const uploadResponse = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // The backend returns the attachment with the created message
            const attachment = uploadResponse.data;
            const message = attachment.message;

            // Add the message to the current messages list optimistically
            if (message) {
                queryClient.setQueryData(['messages', id, isGroup], (old: Message[] = []) => {
                    // Check if message already exists
                    const exists = old.some(m => m.id === message.id);
                    if (exists) {
                        return old.map(m => m.id === message.id ? message : m);
                    }
                    return [...old, message];
                });
            }

            // Also refresh to ensure we have the latest data
            queryClient.invalidateQueries({ queryKey: ['messages', id, isGroup] });
        } catch (error: any) {
            console.error('File upload failed', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file. Please try again.';
            alert(errorMessage);
        } finally {
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleVoiceRecordingComplete = async (audioBlob: Blob, duration: number) => {
        if (!currentUser) return;

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice.webm');
            formData.append('duration', duration.toString());

            const uploadResponse = await api.post('/files/voice', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const messageData = {
                senderId: currentUser.id,
                [isGroup ? 'groupId' : 'receiverId']: id,
            };

            socket?.emit('sendMessage', messageData);
            setShowVoiceRecorder(false);
        } catch (error) {
            console.error('Voice upload failed', error);
        }
    };

    const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
        try {
            socket?.emit('deleteMessage', {
                messageId,
                userId: currentUser?.id,
                deleteForEveryone,
            });
        } catch (error) {
            console.error('Delete message failed', error);
        }
    };

    const handlePinMessage = async (messageId: string, isPinned: boolean) => {
        try {
            // Allow pinning in both individual chats and groups
            socket?.emit('pinMessage', {
                messageId,
                isPinned,
                groupId: isGroup ? id : undefined,
                chatId: !isGroup ? id : undefined, // Include chatId for individual chats
            });
        } catch (error) {
            console.error('Pin message failed', error);
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            socket?.emit('addReaction', {
                messageId,
                userId: currentUser?.id,
                emoji,
            });
        } catch (error) {
            console.error('Add reaction failed', error);
        }
    };

    const handleRemoveReaction = async (messageId: string, emoji: string) => {
        try {
            socket?.emit('removeReaction', {
                messageId,
                userId: currentUser?.id,
                emoji,
            });
        } catch (error) {
            console.error('Remove reaction failed', error);
        }
    };

    // Fetch users and groups for forward modal
    const { data: allUsers = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get<User[]>('/users?includeDeactivated=false');
            return response.data.filter((user) => user.id !== currentUser?.id);
        },
        enabled: showForwardModal,
    });

    const { data: allGroups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const response = await api.get<Group[]>('/groups');
            return response.data;
        },
        enabled: showForwardModal,
    });

    const handleForward = (message: Message) => {
        setForwardMessage(message);
        setShowForwardModal(true);
        setForwardSearchQuery('');
    };

    const handleForwardTo = async (targetId: string, isTargetGroup: boolean) => {
        if (!forwardMessage || !currentUser) return;

        try {
            // Send the message first
            const messageData = {
                content: forwardMessage.content || undefined,
                senderId: currentUser.id,
                [isTargetGroup ? 'groupId' : 'receiverId']: targetId,
                forwardedFromId: forwardMessage.senderId, // Original sender
                forwardedFromMessageId: forwardMessage.id, // Original message ID
            };

            // If message has attachments, forward them with the message
            if (forwardMessage.attachments && forwardMessage.attachments.length > 0) {
                console.log('Forwarding message with attachments:', forwardMessage.attachments);
                
                // For each attachment, create a new message with that attachment
                for (const attachment of forwardMessage.attachments) {
                    const attachmentMessageData = {
                        content: forwardMessage.content || '',
                        senderId: currentUser.id,
                        [isTargetGroup ? 'groupId' : 'receiverId']: targetId,
                        forwardedFromId: forwardMessage.senderId,
                        forwardedFromMessageId: forwardMessage.id,
                    };

                    // Send message via API with attachment URL
                    try {
                        const formData = new FormData();
                        formData.append('senderId', currentUser.id);
                        formData.append(isTargetGroup ? 'groupId' : 'receiverId', targetId);
                        if (forwardMessage.content) {
                            formData.append('content', forwardMessage.content);
                        }
                        
                        // Fetch the attachment file and re-upload it
                        const attachmentUrl = `http://localhost:3001${attachment.url}`;
                        const response = await fetch(attachmentUrl);
                        const blob = await response.blob();
                        const fileName = attachment.url.split('/').pop() || 'file';
                        formData.append('file', blob, fileName);

                        await fetch('http://localhost:3001/api/files/upload', {
                            method: 'POST',
                            body: formData,
                        });
                    } catch (error) {
                        console.error('Failed to forward attachment:', error);
                    }
                }
            } else {
                // No attachments, just send the text message
                socket?.emit('sendMessage', messageData);
            }

            setShowForwardModal(false);
            setForwardMessage(null);
            setForwardSearchQuery('');

            // Navigate to the forwarded chat
            if (isTargetGroup) {
                navigate(`/groups/${targetId}`);
            } else {
                navigate(`/messages/${targetId}`);
            }
        } catch (error) {
            console.error('Forward message failed', error);
        }
    };

    const filteredForwardOptions = React.useMemo(() => {
        const query = forwardSearchQuery.toLowerCase();
        const filteredUsers = allUsers.filter(
            (user) =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
        );
        const filteredGroups = allGroups.filter((group) =>
            group.name.toLowerCase().includes(query)
        );
        return { users: filteredUsers, groups: filteredGroups };
    }, [allUsers, allGroups, forwardSearchQuery]);

    const handleEmojiClick = (emojiObject: any) => {
        setNewMessage((prev) => prev + emojiObject.emoji);
    };

    const groupMessagesByDate = (messages: Message[]) => {
        const grouped: { [key: string]: Message[] } = {};
        messages.forEach((msg) => {
            const date = new Date(msg.createdAt);
            let key: string;
            if (isToday(date)) {
                key = 'Today';
            } else if (isYesterday(date)) {
                key = 'Yesterday';
            } else {
                key = format(date, 'MMMM d, yyyy');
            }
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(msg);
        });
        return grouped;
    };

    if (!id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>No chat selected</p>
                </div>
            </div>
        );
    }

    if (isLoadingChatInfo || isLoadingMessages || !chatInfo) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
                </div>
            </div>
        );
    }

    const name = chatInfo ? (isGroup ? (chatInfo as Group).name : (chatInfo as User).name) : 'Loading...';
    const rawPicture = chatInfo ? (isGroup ? (chatInfo as Group).picture : (chatInfo as User).profilePicture) : null;
    const isOnline = !isGroup && chatInfo ? (chatInfo as User).isOnline : false;
    
    // Convert relative picture URLs to full URLs
    const getPictureUrl = (pic?: string | null): string | null => {
        if (!pic) return null;
        if (pic.startsWith('http://') || pic.startsWith('https://')) return pic;
        // If it's a relative path, construct full URL
        if (pic.startsWith('/')) {
            const apiBaseURL = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                ? `http://${window.location.hostname}:3001`
                : 'http://localhost:3001';
            return `${apiBaseURL}${pic}`;
        }
        return pic;
    };
    
    const picture = getPictureUrl(rawPicture);

    const groupedMessages = groupMessagesByDate(messages);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex flex-col h-full bg-[#f5f5f5] relative overflow-hidden">
            {/* Mobile Header - Visible on mobile */}
            <div className="flex md:hidden min-h-[60px] bg-white border-b border-[#e5e5e5] items-center px-4 gap-3 z-50 shadow-sm mobile-header flex-shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    className="text-[#005d99] text-xl p-2 active:opacity-70 transition-opacity flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                    ←
                </button>

                <div
                    className="flex items-center cursor-pointer flex-1 min-w-0"
                    onClick={() => isGroup && navigate(`/groups/${id}/info`)}
                >
                    {picture ? (
                        <img
                            src={picture}
                            alt={name}
                            className="w-9 h-9 rounded-full object-cover mr-3 flex-shrink-0 border border-gray-200"
                            onError={(e) => {
                                // If image fails to load, hide it and show initials instead
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : null}
                    {(!picture || !picture.includes('http')) && (
                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0 shadow-sm">
                            {getInitials(name)}
                            {isOnline && !isGroup && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#17a74a] rounded-full border-2 border-white"></div>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h2 className="text-[15px] font-semibold text-[#1f2937] truncate leading-tight">
                            {name || 'Loading...'}
                        </h2>
                        {typingUsers.length > 0 ? (
                            <p className="text-xs text-[#17a74a] truncate">
                                typing...
                            </p>
                        ) : isOnline && !isGroup ? (
                            <p className="text-xs text-[#17a74a] truncate">Online</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xl text-[#6b7280] relative flex-shrink-0">
                    <div className="relative">
                        <button 
                            onClick={() => {
                                if (!isGroup) {
                                    setShowContactPopup(!showContactPopup);
                                } else {
                                    alert('Group call feature coming soon');
                                }
                            }}
                            className="cursor-pointer active:opacity-70 hover:text-[#005d99] transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title={!isGroup ? "Contact Info" : "Group Call"}
                        >
                            <FaPhone className="text-lg" />
                        </button>
                        {/* Contact Info Popup - Mobile */}
                        {showContactPopup && !isGroup && chatInfo && (
                            <div className="fixed inset-0 z-[100] md:hidden" onClick={() => setShowContactPopup(false)}>
                                <div 
                                    className="absolute right-4 top-16 w-80 rounded-lg shadow-xl bg-white border border-gray-200 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Header with Avatar */}
                                    <div className="p-4 bg-gradient-to-r from-[#005d99] to-[#17a74a] text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-sm">Contact Information</h3>
                                            <button
                                                onClick={() => setShowContactPopup(false)}
                                                className="text-white hover:text-gray-200 transition-colors"
                                            >
                                                <FaTimes className="text-sm" />
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {(chatInfo as User).profilePicture ? (
                                                <img 
                                                    src={(chatInfo as User).profilePicture} 
                                                    alt={(chatInfo as User).name}
                                                    className="w-12 h-12 rounded-full border-2 border-white"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-semibold border-2 border-white">
                                                    {(chatInfo as User).name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white truncate">{(chatInfo as User).name}</p>
                                                <p className="text-xs text-white text-opacity-90 truncate">{(chatInfo as User).jobTitle}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Contact Details */}
                                    <div className="p-4 bg-white space-y-3">
                                        {(chatInfo as User).department && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">🏢</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Department</p>
                                                    <p className="text-sm text-gray-900 font-medium">{(chatInfo as User).department}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(chatInfo as User).email && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">📧</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <a 
                                                        href={`mailto:${(chatInfo as User).email}`}
                                                        className="text-sm text-[#005d99] hover:underline break-all"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {(chatInfo as User).email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(chatInfo as User).phone && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">📱</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Mobile Phone</p>
                                                    <a 
                                                        href={`tel:${(chatInfo as User).phone}`}
                                                        className="text-sm text-[#005d99] hover:underline font-medium"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {(chatInfo as User).phone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(chatInfo as User).avayaNumber && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">☎️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Avaya Extension</p>
                                                    <p className="text-sm text-gray-900 font-medium">{(chatInfo as User).avayaNumber}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {!(chatInfo as User).email && !(chatInfo as User).phone && !(chatInfo as User).avayaNumber && (
                                            <p className="text-sm text-gray-500 text-center py-2">No contact information available</p>
                                        )}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    {(chatInfo as User).phone && (
                                        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    window.location.href = `tel:${(chatInfo as User).phone}`;
                                                    setShowContactPopup(false);
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-[#005d99] text-white rounded-lg hover:bg-[#004d7a] transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                                            >
                                                <FaPhone className="text-xs" />
                                                <span>Call Now</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate(`/members/${(chatInfo as User).id}`);
                                                    setShowContactPopup(false);
                                                }}
                                                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center justify-center"
                                            >
                                                <FaUserCircle />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                            className="cursor-pointer active:opacity-70 hover:text-[#005d99] transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="More options"
                        >
                            <FaEllipsisV className="text-lg" />
                        </button>
                        {/* Header Menu - Mobile */}
                        {showHeaderMenu && (
                            <div className="fixed inset-0 z-[100] md:hidden" onClick={() => setShowHeaderMenu(false)}>
                                <div 
                                    className="absolute right-4 top-16 w-64 rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isGroup && (
                                        <button
                                            onClick={() => {
                                                navigate(`/groups/${id}/info`);
                                                setShowHeaderMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                            <FaUsers />
                                            <span>Group Info</span>
                                        </button>
                                    )}
                                    {!isGroup && (
                                        <button
                                            onClick={() => {
                                                navigate(`/profile/${id}`);
                                                setShowHeaderMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                            <FaUserCircle />
                                            <span>View Profile</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to clear this chat?')) {
                                                console.log('Clear chat');
                                            }
                                            setShowHeaderMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                        <FaTrash />
                                        <span>Clear Chat</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden md:flex h-[60px] bg-white border-b border-[#e5e5e5] items-center px-4 gap-3 sticky top-16 z-40 shadow-sm flex-shrink-0">
                <button 
                    onClick={() => navigate(-1)} 
                    className="text-[#005d99] text-xl p-1 active:opacity-70 transition-opacity"
                >
                    ←
                </button>

                <div
                    className="flex items-center cursor-pointer flex-1 min-w-0"
                    onClick={() => isGroup && navigate(`/groups/${id}/info`)}
                >
                    {picture ? (
                        <img
                            src={picture}
                            alt={name}
                            className="w-9 h-9 rounded-full object-cover mr-3 flex-shrink-0 border border-gray-200"
                            onError={(e) => {
                                // If image fails to load, hide it and show initials instead
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : null}
                    {(!picture || !picture.includes('http')) && (
                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0 shadow-sm">
                            {getInitials(name)}
                            {isOnline && !isGroup && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#17a74a] rounded-full border-2 border-white"></div>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h2 className="text-[15px] font-semibold text-[#1f2937] truncate leading-tight">
                            {name || 'Loading...'}
                        </h2>
                        {typingUsers.length > 0 ? (
                            <p className="text-xs text-[#17a74a] truncate">
                                typing...
                            </p>
                        ) : isOnline && !isGroup ? (
                            <p className="text-xs text-[#17a74a] truncate">Online</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xl text-[#6b7280] relative">
                    <div className="relative">
                        <button 
                            onClick={() => {
                                if (!isGroup) {
                                    setShowContactPopup(!showContactPopup);
                                } else {
                                    // For groups, could initiate group call
                                    alert('Group call feature coming soon');
                                }
                            }}
                            className="cursor-pointer active:opacity-70 hover:text-[#005d99] transition-colors"
                            title={!isGroup ? "Contact Info" : "Group Call"}
                        >
                            <FaPhone className="text-lg" />
                        </button>
                        {/* Contact Info Popup - Desktop */}
                        {showContactPopup && !isGroup && chatInfo && (
                            <div className="fixed inset-0 z-[100] hidden md:flex items-start justify-end pt-16 pr-4" onClick={() => setShowContactPopup(false)}>
                                <div 
                                    className="w-80 rounded-lg shadow-xl bg-white border border-gray-200 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Header with Avatar */}
                                    <div className="p-4 bg-gradient-to-r from-[#005d99] to-[#17a74a] text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-sm">Contact Information</h3>
                                            <button
                                                onClick={() => setShowContactPopup(false)}
                                                className="text-white hover:text-gray-200 transition-colors"
                                            >
                                                <FaTimes className="text-sm" />
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {(chatInfo as User).profilePicture ? (
                                                <img 
                                                    src={(chatInfo as User).profilePicture} 
                                                    alt={(chatInfo as User).name}
                                                    className="w-12 h-12 rounded-full border-2 border-white"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-semibold border-2 border-white">
                                                    {(chatInfo as User).name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white truncate">{(chatInfo as User).name}</p>
                                                <p className="text-xs text-white text-opacity-90 truncate">{(chatInfo as User).jobTitle}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Contact Details */}
                                    <div className="p-4 bg-white space-y-3">
                                        {(chatInfo as User).department && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">🏢</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Department</p>
                                                    <p className="text-sm text-gray-900 font-medium">{(chatInfo as User).department}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(chatInfo as User).email && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">📧</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <a 
                                                        href={`mailto:${(chatInfo as User).email}`}
                                                        className="text-sm text-[#005d99] hover:underline break-all"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {(chatInfo as User).email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(chatInfo as User).phone && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">📱</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Mobile Phone</p>
                                                    <a 
                                                        href={`tel:${(chatInfo as User).phone}`}
                                                        className="text-sm text-[#005d99] hover:underline font-medium"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {(chatInfo as User).phone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(chatInfo as User).avayaNumber && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 text-sm">☎️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500">Avaya Extension</p>
                                                    <p className="text-sm text-gray-900 font-medium">{(chatInfo as User).avayaNumber}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {!(chatInfo as User).email && !(chatInfo as User).phone && !(chatInfo as User).avayaNumber && (
                                            <p className="text-sm text-gray-500 text-center py-2">No contact information available</p>
                                        )}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    {(chatInfo as User).phone && (
                                        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    window.location.href = `tel:${(chatInfo as User).phone}`;
                                                    setShowContactPopup(false);
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-[#005d99] text-white rounded-lg hover:bg-[#004d7a] transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                                            >
                                                <FaPhone className="text-xs" />
                                                <span>Call Now</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate(`/members/${(chatInfo as User).id}`);
                                                    setShowContactPopup(false);
                                                }}
                                                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center justify-center"
                                            >
                                                <FaUserCircle />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                            className="cursor-pointer active:opacity-70 hover:text-[#005d99] transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="More options"
                        >
                            <FaEllipsisV className="text-lg" />
                        </button>
                        {/* Header Menu - Desktop */}
                        {showHeaderMenu && (
                            <div className="fixed inset-0 z-[100] hidden md:flex items-start justify-end pt-16 pr-4" onClick={() => setShowHeaderMenu(false)}>
                                <div 
                                    className="w-64 rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isGroup && (
                                        <button
                                            onClick={() => {
                                                navigate(`/groups/${id}/info`);
                                                setShowHeaderMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                            <FaUsers />
                                            <span>Group Info</span>
                                        </button>
                                    )}
                                    {!isGroup && (
                                        <button
                                            onClick={() => {
                                                navigate(`/profile/${id}`);
                                                setShowHeaderMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                            <FaUserCircle />
                                            <span>View Profile</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            // Clear chat or archive functionality
                                            if (confirm('Are you sure you want to clear this chat?')) {
                                                // Implement clear chat functionality
                                                console.log('Clear chat');
                                            }
                                            setShowHeaderMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                        <FaTrash />
                                        <span>Clear Chat</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area with Mobile Gradient Background */}
            <div className="flex-1 min-h-0 overflow-y-auto px-2 md:px-5 py-4 bg-gradient-to-b from-[#dfe9f3] to-[#f0f2f5] flex flex-col chat-messages-area" style={{ WebkitOverflowScrolling: 'touch' }}>
                {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                    <div key={dateKey}>
                        <div className="text-center my-[30px] mb-5 date-divider">
                            <span className="inline-block px-3 py-[5px] bg-white/85 rounded-[7.5px] text-[12.5px] font-medium text-[#667781] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] date-badge">
                                {dateKey}
                            </span>
                        </div>
                        <div>
                            {dateMessages.map((msg, index) => {
                                const prevMsg = index > 0 ? dateMessages[index - 1] : null;
                                const showDateSeparator =
                                    !prevMsg ||
                                    !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt)) ||
                                    msg.senderId !== prevMsg.senderId;

                                return (
                                    <div key={msg.id} className="animate-fade-in mb-2">
                                        <MessageBubble
                                            message={msg}
                                            isMe={msg.senderId === currentUser?.id}
                                            currentUser={currentUser}
                                            onReply={setReplyTo}
                                            onForward={handleForward}
                                            onDelete={handleDeleteMessage}
                                            onPin={handlePinMessage}
                                            onReaction={handleReaction}
                                            onRemoveReaction={handleRemoveReaction}
                                            showSenderName={isGroup && !showDateSeparator}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {typingUsers.length > 0 && (
                    <div className="flex gap-3 max-w-[75%] mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {chatInfo && !isGroup ? getInitials((chatInfo as User).name) : 'G'}
                        </div>
                        <div className="bg-white rounded-[18px] rounded-bl-[4px] px-4 py-3 flex gap-1 shadow-sm">
                            <div className="w-2 h-2 bg-[#6b7280] rounded-full typing-dot" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-[#6b7280] rounded-full typing-dot" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-[#6b7280] rounded-full typing-dot" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
                <div className="px-4 md:px-6 py-2 bg-white border-t border-[#e5e5e5] flex-shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#6b7280]">Replying to {replyTo.sender?.name}</p>
                            <p className="text-sm text-[#1f2937] truncate">
                                {replyTo.content && !replyTo.content.includes('Sent an image') && !replyTo.content.includes('Sent a video') && !replyTo.content.includes('Sent an attachment') 
                                    ? replyTo.content 
                                    : replyTo.attachments && replyTo.attachments.length > 0
                                        ? `${replyTo.attachments.length === 1 ? '📎 ' + replyTo.attachments[0].filename : '📎 ' + replyTo.attachments.length + ' files'}`
                                        : 'Media'
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="ml-2 text-[#6b7280] hover:text-[#1f2937] text-xl touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Voice Recorder */}
            {showVoiceRecorder && (
                <div className="px-4 md:px-6 py-2 bg-white border-t border-[#e5e5e5] flex-shrink-0">
                    <VoiceRecorder
                        onRecordingComplete={handleVoiceRecordingComplete}
                        onCancel={() => setShowVoiceRecorder(false)}
                    />
                </div>
            )}

            {/* Input Area */}
            {!showVoiceRecorder && (
                <div className="bg-white border-t border-[#e5e5e5] px-3 py-2 flex items-center gap-2 shadow-lg chat-input-area flex-shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="w-10 h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xl text-[#6b7280] active:bg-[#f3f4f6] transition-colors touch-manipulation"
                    >
                        <FaSmile className="text-lg" />
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <form onSubmit={sendMessage} className="flex-1 flex items-center min-w-0">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 h-10 md:h-10 rounded-[20px] border-none px-4 text-[15px] bg-[#f3f4f6] focus:outline-none focus:bg-[#e5e5e5] transition-colors min-w-0"
                            style={{ fontSize: '16px' }} // Prevents zoom on iOS
                        />
                    </form>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xl text-[#6b7280] active:bg-[#f3f4f6] transition-colors touch-manipulation flex-shrink-0"
                    >
                        <FaPaperclip className="text-lg" />
                    </button>

                    {newMessage.trim() ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                            className="w-10 h-10 rounded-full border-none bg-gradient-to-br from-[#005d99] to-[#17a74a] text-white flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform touch-manipulation flex-shrink-0"
                        >
                            <FaPaperPlane className="text-sm" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowVoiceRecorder(true)}
                            className="w-10 h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xl text-[#6b7280] active:bg-[#f3f4f6] transition-colors touch-manipulation flex-shrink-0"
                        >
                            <FaMicrophone className="text-lg" />
                        </button>
                    )}

                    {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 z-20 w-full max-w-[calc(100vw-24px)] md:max-w-md">
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Forward Modal */}
            {showForwardModal && forwardMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Forward Message</h2>
                                <button
                                    onClick={() => {
                                        setShowForwardModal(false);
                                        setForwardMessage(null);
                                        setForwardSearchQuery('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>
                            <div className="relative">
                                <FaUserCircle className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users or groups..."
                                    value={forwardSearchQuery}
                                    onChange={(e) => setForwardSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005d99]"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredForwardOptions.users.length === 0 && filteredForwardOptions.groups.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No results found</div>
                            ) : (
                                <div className="space-y-1">
                                    {/* Users Section */}
                                    {filteredForwardOptions.users.length > 0 && (
                                        <>
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                                Users
                                            </div>
                                            {filteredForwardOptions.users.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleForwardTo(user.id, false)}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    {user.profilePicture ? (
                                                        <img
                                                            src={user.profilePicture}
                                                            alt={user.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 text-left min-w-0">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {user.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    )}

                                    {/* Groups Section */}
                                    {filteredForwardOptions.groups.length > 0 && (
                                        <>
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-2">
                                                Groups
                                            </div>
                                            {filteredForwardOptions.groups.map((group) => (
                                                <button
                                                    key={group.id}
                                                    onClick={() => handleForwardTo(group.id, true)}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    {group.picture ? (
                                                        <img
                                                            src={group.picture}
                                                            alt={group.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white">
                                                            <FaUsers className="text-xl" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 text-left min-w-0">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {group.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Group
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
