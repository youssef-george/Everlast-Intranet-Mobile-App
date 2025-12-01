import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { FaArrowLeft, FaPaperPlane, FaPaperclip, FaSmile, FaMicrophone, FaUserCircle, FaEllipsisV } from 'react-icons/fa';
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

    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [recordingMode, setRecordingMode] = useState(false);
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

    // Fetch messages
    const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
        queryKey: ['messages', id],
        queryFn: async () => {
            if (!id || !currentUser?.id) throw new Error('Chat ID and user ID are required');
            const endpoint = isGroup
                ? `/chat/group/${id}/messages`
                : `/chat/messages/${currentUser.id}/${id}`;
            const response = await api.get<Message[]>(endpoint);
            return response.data.filter((msg) => {
                // Filter out messages deleted for current user
                if (msg.deletedFor) {
                    const deletedFor = JSON.parse(msg.deletedFor);
                    return !deletedFor.includes(currentUser.id);
                }
                return !msg.isDeleted || msg.senderId === currentUser.id;
            });
        },
        enabled: !!currentUser && !!id,
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchInterval: false, // Disable polling - we use socket for real-time updates
    });

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

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: Message) => {
            if (
                (isGroup && message.groupId === id) ||
                (!isGroup && (message.senderId === id || message.receiverId === id))
            ) {
                queryClient.setQueryData(['messages', id], (old: Message[] = []) => {
                    // Check if message already exists by real ID
                    const existsById = old.find((m) => m.id === message.id);
                    if (existsById) return old; // Already have this message
                    
                    // Check if this is replacing an optimistic message
                    const contentKey = message.content || '';
                    const tempId = pendingMessagesRef.current.get(contentKey);
                    if (tempId) {
                        // Replace optimistic message with real one
                        pendingMessagesRef.current.delete(contentKey);
                        return old.map((m) => (m.id === tempId ? message : m));
                    }
                    
                    // New message from other user
                    return [...old, message];
                });
                
                // If message is from another user and we're viewing this chat, mark as delivered and seen
                if (message.senderId !== currentUser?.id) {
                    // Mark as delivered
                    socket.emit('messageDelivered', { messageId: message.id });
                    // Mark as seen since we're viewing the chat
                    socket.emit('messageSeen', { messageId: message.id });
                }
            }
        };

        const handleMessageSent = (message: Message) => {
            // Handle message sent confirmation - replace optimistic message with real one
            if (
                (isGroup && message.groupId === id) ||
                (!isGroup && (message.senderId === id || message.receiverId === id))
            ) {
                queryClient.setQueryData(['messages', id], (old: Message[] = []) => {
                    // Find and replace optimistic message by content
                    const contentKey = message.content || '';
                    const tempId = pendingMessagesRef.current.get(contentKey);
                    
                    if (tempId) {
                        pendingMessagesRef.current.delete(contentKey);
                        // Replace optimistic message with real one
                        return old.map((m) => (m.id === tempId ? message : m));
                    }
                    
                    // If no optimistic message found, check if real message already exists
                    const exists = old.find((m) => m.id === message.id);
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
            queryClient.setQueryData(['messages', id], (old: Message[] = []) =>
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
            queryClient.setQueryData(['messages', id], (old: Message[] = []) =>
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

        const handleMessageDeleted = (data: { messageId: string }) => {
            queryClient.setQueryData(['messages', id], (old: Message[] = []) =>
                old.map((msg) =>
                    msg.id === data.messageId ? { ...msg, isDeleted: true } : msg
                )
            );
        };

        socket.on('newMessage', handleNewMessage);
        // Note: messageSent is handled by newMessage for sender, so we can skip it
        // socket.on('messageSent', handleMessageSent);
        socket.on('userTyping', handleTyping);
        socket.on('userStoppedTyping', handleStopTyping);
        socket.on('messageStatusUpdate', handleMessageStatusUpdate);
        socket.on('reactionAdded', handleReactionAdded);
        socket.on('messageDeleted', handleMessageDeleted);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messageSent', handleMessageSent);
            socket.off('userTyping', handleTyping);
            socket.off('userStoppedTyping', handleStopTyping);
            socket.off('messageStatusUpdate', handleMessageStatusUpdate);
            socket.off('reactionAdded', handleReactionAdded);
            socket.off('messageDeleted', handleMessageDeleted);
        };
    }, [socket, id, isGroup, queryClient]);

    // Typing indicator with proper debouncing
    useEffect(() => {
        if (!socket || !currentUser || !id || !socket.connected) {
            console.log('⚠️ Socket not ready:', { socket: !!socket, currentUser: !!currentUser, id, connected: socket?.connected });
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
                console.log('📤 Emitting typing event:', typingData, 'Socket connected:', socket.connected);
                socket.emit('typing', typingData);
                lastTypingEmitRef.current = now;
                setIsTyping(true);
            } else {
                // Schedule emit after debounce period
                typingDebounceRef.current = setTimeout(() => {
                    const typingData = { userId: currentUser.id, chatId: id, isGroup };
                    console.log('📤 Emitting typing event (debounced):', typingData);
                    socket.emit('typing', typingData);
                    lastTypingEmitRef.current = Date.now();
                    setIsTyping(true);
                }, 1000 - timeSinceLastEmit);
            }

            // Set timeout to stop typing after 3 seconds of no changes
            typingTimeoutRef.current = setTimeout(() => {
                const typingData = { userId: currentUser.id, chatId: id, isGroup };
                console.log('📤 Emitting stop typing event (timeout):', typingData);
                socket.emit('stopTyping', typingData);
                setIsTyping(false);
            }, 3000);
        } else {
            // If message is empty, stop typing immediately
            const typingData = { userId: currentUser.id, chatId: id, isGroup };
            console.log('📤 Emitting stop typing event (empty message):', typingData);
            socket.emit('stopTyping', typingData);
            setIsTyping(false);
            lastTypingEmitRef.current = 0;
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

        queryClient.setQueryData(['messages', id], (old: Message[] = []) => [...old, optimisticMessage]);
        setNewMessage('');
        setReplyTo(null);
        setShowEmojiPicker(false);

        try {
            socket?.emit('sendMessage', messageData);
        } catch (error) {
            console.error('Failed to send message', error);
            // Remove optimistic message on error
            pendingMessagesRef.current.delete(contentKey);
            queryClient.setQueryData(['messages', id], (old: Message[] = []) =>
                old.filter((m) => m.id !== tempId)
            );
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        try {
            // Create message first
            const messageData = {
                senderId: currentUser.id,
                [isGroup ? 'groupId' : 'receiverId']: id,
            };

            socket?.emit('sendMessage', messageData);

            // Upload file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('messageId', 'temp'); // Will be updated by backend

            const uploadResponse = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Update message with attachment
            // This would typically be handled by the backend
        } catch (error) {
            console.error('File upload failed', error);
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

    const name = isGroup ? (chatInfo as Group).name : (chatInfo as User).name;
    const picture = isGroup ? (chatInfo as Group).picture : (chatInfo as User).profilePicture;
    const isOnline = !isGroup && (chatInfo as User).isOnline;

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
        <div className="flex flex-col h-full bg-[#f0f2f5]">
            {/* Header */}
            <div className="h-16 bg-white border-b border-[#e5e5e5] flex items-center px-6 gap-4">
                <button onClick={() => navigate(-1)} className="md:hidden text-[#6b7280] p-2 hover:bg-[#f3f4f6] rounded-full transition-colors">
                    <FaArrowLeft className="text-xl" />
                </button>

                <div
                    className="flex items-center cursor-pointer flex-1 min-w-0"
                    onClick={() => isGroup && navigate(`/groups/${id}/info`)}
                >
                    {picture ? (
                        <img
                            src={picture}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover mr-3 flex-shrink-0"
                        />
                    ) : (
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0">
                            {getInitials(name)}
                            {isOnline && !isGroup && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#17a74a] rounded-full border-2 border-white"></div>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-[#1f2937] truncate">
                            {name}
                        </h2>
                        {typingUsers.length > 0 ? (
                            <p className="text-[13px] text-[#6b7280] italic">
                                {typingUsers.length === 1 ? 'typing...' : `${typingUsers.length} typing...`}
                            </p>
                        ) : isOnline && !isGroup ? (
                            <p className="text-[13px] text-[#17a74a]">Online</p>
                        ) : null}
                    </div>
                </div>

                <button className="text-[#6b7280] p-2 hover:bg-[#f3f4f6] rounded-full transition-colors">
                    <FaEllipsisV className="text-xl" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#f0f2f5] flex flex-col gap-4">
                {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                    <div key={dateKey}>
                        <div className="text-center my-4">
                            <span className="px-3 py-1 bg-white/80 rounded-full text-xs text-[#6b7280]">
                                {dateKey}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {dateMessages.map((msg, index) => {
                                const prevMsg = index > 0 ? dateMessages[index - 1] : null;
                                const showDateSeparator =
                                    !prevMsg ||
                                    !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt)) ||
                                    msg.senderId !== prevMsg.senderId;

                                return (
                                    <div key={msg.id}>
                                        <MessageBubble
                                            message={msg}
                                            isMe={msg.senderId === currentUser?.id}
                                            currentUser={currentUser}
                                            onReply={setReplyTo}
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
                    <div className="flex gap-3 max-w-[65%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {chatInfo && !isGroup ? getInitials((chatInfo as User).name) : 'G'}
                        </div>
                        <div className="bg-white rounded-xl rounded-bl-sm px-4 py-3 flex gap-1">
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
                <div className="px-6 py-2 bg-white border-t border-[#e5e5e5]">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#6b7280]">Replying to {replyTo.sender?.name}</p>
                            <p className="text-sm text-[#1f2937] truncate">
                                {replyTo.content || 'Sent an attachment'}
                            </p>
                        </div>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="ml-2 text-[#6b7280] hover:text-[#1f2937] text-xl"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Voice Recorder */}
            {showVoiceRecorder && (
                <div className="px-6 py-2 bg-white border-t border-[#e5e5e5]">
                    <VoiceRecorder
                        onRecordingComplete={handleVoiceRecordingComplete}
                        onCancel={() => setShowVoiceRecorder(false)}
                    />
                </div>
            )}

            {/* Input Area */}
            {!showVoiceRecorder && (
                <div className="bg-white border-t border-[#e5e5e5] px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors hover:bg-[#f3f4f6] text-[#6b7280]"
                    >
                        <FaPaperclip className="text-xl" />
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="w-10 h-10 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors hover:bg-[#f3f4f6] text-[#6b7280]"
                    >
                        <FaSmile className="text-xl" />
                    </button>

                    {showEmojiPicker && (
                        <div className="absolute bottom-20 left-4 z-20">
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                    )}

                    <form onSubmit={sendMessage} className="flex-1 flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 h-11 rounded-[22px] border border-[#e5e5e5] px-5 text-sm bg-[#f3f4f6] focus:outline-none focus:border-[#005d99] focus:bg-white transition-colors"
                        />
                    </form>

                    {newMessage.trim() ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                            className="w-11 h-11 rounded-full border-none bg-gradient-to-br from-[#005d99] to-[#17a74a] text-white cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
                        >
                            <FaPaperPlane className="text-lg" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowVoiceRecorder(true)}
                            className="w-10 h-10 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors hover:bg-[#f3f4f6] text-[#6b7280]"
                        >
                            <FaMicrophone className="text-xl" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
