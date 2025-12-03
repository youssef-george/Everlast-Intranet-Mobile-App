import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaCheck, FaCheckDouble, FaTrash, FaThumbtack } from 'react-icons/fa';
import type { Message, User } from '../types';
import AttachmentPreview from './AttachmentPreview';
import ReactionPicker from './ReactionPicker';

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    currentUser?: User | null;
    onReply?: (message: Message) => void;
    onForward?: (message: Message) => void;
    onDelete?: (messageId: string, deleteForEveryone: boolean) => void;
    onPin?: (messageId: string, isPinned: boolean) => void;
    onReaction?: (messageId: string, emoji: string) => void;
    onRemoveReaction?: (messageId: string, emoji: string) => void;
    showSenderName?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isMe,
    currentUser,
    onReply,
    onForward,
    onDelete,
    onPin,
    onReaction,
    onRemoveReaction,
    showSenderName = false,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const isLongPressingRef = React.useRef(false);
    const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const clickCountRef = React.useRef(0);

    const handleLongPress = () => {
        setShowMenu(true);
    };

    const handleMouseDown = () => {
        isLongPressingRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressingRef.current = true;
            handleLongPress();
        }, 500); // 500ms for long press
    };

    const handleMouseUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        // Prevent menu from showing on regular click
        isLongPressingRef.current = false;
        
        // Handle double-click for reply
        clickCountRef.current += 1;
        if (clickCountRef.current === 1) {
            clickTimerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 300); // 300ms window for double-click
        } else if (clickCountRef.current === 2) {
            // Double-click detected
            if (onReply && !isDeleted) {
                onReply(message);
            }
            clickCountRef.current = 0;
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        }
    };

    const handleReplyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onReply && !isDeleted) {
            onReply(message);
        }
    };

    const handleReactClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowReactionPicker(true);
    };

    const handleDelete = (deleteForEveryone: boolean) => {
        if (onDelete) {
            onDelete(message.id, deleteForEveryone);
        }
        setShowMenu(false);
    };

    const handleReaction = (emoji: string) => {
        if (onReaction) {
            onReaction(message.id, emoji);
        }
        setShowReactionPicker(false);
    };

    const handleRemoveReaction = (emoji: string) => {
        if (onRemoveReaction) {
            onRemoveReaction(message.id, emoji);
        }
    };

    const isDeleted = message.isDeleted || (message.deletedFor && JSON.parse(message.deletedFor || '[]').includes(currentUser?.id));

    React.useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

    return (
        <div
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 w-full group relative message-row ${isMe ? 'sent' : 'received'}`}
            onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress();
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onClick={handleClick}
        >
            {/* Avatar for received messages - appears first */}
            {!isMe && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-[13px] flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                    {message.sender?.name ? message.sender.name.charAt(0).toUpperCase() : 'U'}
                </div>
            )}

            {/* Quick Action Buttons - order: 2 for received, -1 for sent */}
            {!isDeleted && (
                <div className={`flex gap-[1px] md:gap-[2px] transition-opacity duration-150 flex-shrink-0 quick-actions ${
                    isMe ? 'order-[-1] mr-0.5 md:mr-1' : 'order-2 ml-0.5 md:ml-1'
                } opacity-0 md:group-hover:opacity-100`}>
                    {onReply && (
                        <button
                            onClick={handleReplyClick}
                            className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border-none flex items-center justify-center cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#f5f6f6] hover:scale-[1.08] active:bg-[#eaebed] active:scale-95 transition-all duration-150 touch-manipulation"
                            title="Reply"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#54656f] w-3.5 h-3.5 md:w-4 md:h-4">
                                <path d="M9 14L4 9l5-5"/>
                                <path d="M20 20v-7a4 4 0 00-4-4H4"/>
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={handleReactClick}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border-none flex items-center justify-center cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#f5f6f6] hover:scale-[1.08] active:bg-[#eaebed] active:scale-95 transition-all duration-150 touch-manipulation"
                        title="Add reaction"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#54656f] w-3.5 h-3.5 md:w-4 md:h-4">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                        </svg>
                    </button>
                    {onForward && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onForward) {
                                    onForward(message);
                                }
                            }}
                            className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border-none flex items-center justify-center cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#f5f6f6] hover:scale-[1.08] active:bg-[#eaebed] active:scale-95 transition-all duration-150 touch-manipulation"
                            title="Forward"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#54656f] w-3.5 h-3.5 md:w-4 md:h-4">
                                <polyline points="13 17 18 12 13 7"/>
                                <polyline points="6 17 11 12 6 7"/>
                            </svg>
                        </button>
                    )}
                </div>
            )}

            <div 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[calc(100vw-120px)] md:max-w-[480px] relative message-bubble-container`}
            >
                <div
                    className={`rounded-[7.5px] pt-[6px] pr-[7px] pb-[8px] pl-[9px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer message-bubble ${
                        isMe
                            ? 'bg-[#d9fdd3] rounded-br-[0]'
                            : 'bg-white rounded-bl-[0]'
                    }`}
                >
                {showSenderName && !isMe && message.sender && (
                    <p className="text-xs font-bold text-orange-500 mb-1">
                        {message.sender.name}
                    </p>
                )}

                {/* Forwarded Message Indicator */}
                {message.forwardedFromMessage && (
                    <div className="mb-[6px] pl-[12px] pr-[10px] border-l-[3px] border-[#17a74a] bg-gradient-to-r from-[rgba(23,167,74,0.12)] via-[rgba(23,167,74,0.08)] to-[rgba(23,167,74,0.03)] rounded-[6px] py-2.5 relative overflow-hidden shadow-sm">
                        {/* Decorative background pattern */}
                        <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.03] pointer-events-none">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-[#17a74a]">
                                <polyline points="13 17 18 12 13 7"/>
                                <polyline points="6 17 11 12 6 7"/>
                            </svg>
                        </div>
                        
                        {/* Forwarded header */}
                        <div className="flex items-center gap-2 mb-1.5 relative z-10">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#17a74a]/20 flex-shrink-0 shadow-sm">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#17a74a]">
                                    <polyline points="13 17 18 12 13 7"/>
                                    <polyline points="6 17 11 12 6 7"/>
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#17a74a] opacity-95 whitespace-nowrap">
                                    Forwarded from
                                </span>
                                <span className="text-xs font-semibold text-[#17a74a] truncate">
                                    {message.forwardedFrom?.name || message.forwardedFromMessage.sender?.name || 'User'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Original message preview */}
                        <div className="relative z-10 pl-0.5">
                            {message.forwardedFromMessage.content && !message.forwardedFromMessage.content.includes('Sent an image') && !message.forwardedFromMessage.content.includes('Sent a video') && !message.forwardedFromMessage.content.includes('Sent an attachment') && (
                                <p className="text-[13px] text-[#4b5563] leading-relaxed line-clamp-2 font-normal">
                                    {message.forwardedFromMessage.content}
                                </p>
                            )}
                            {message.forwardedFromMessage.attachments && message.forwardedFromMessage.attachments.length > 0 && (
                                <p className="text-[13px] text-[#4b5563] leading-relaxed font-normal">
                                    {message.forwardedFromMessage.attachments.length === 1 
                                        ? `📎 ${message.forwardedFromMessage.attachments[0].filename}`
                                        : `📎 ${message.forwardedFromMessage.attachments.length} files`
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {message.replyTo && (
                    <div className="mb-[6px] pl-[10px] border-l-[3px] border-[#005d99] bg-[rgba(0,93,153,0.1)] rounded-[6px] py-2">
                        <p className="text-xs font-semibold text-[#005d99] mb-0.5">
                            {message.replyTo.sender?.name || 'User'}
                        </p>
                        {message.replyTo.content && !message.replyTo.content.includes('Sent an image') && !message.replyTo.content.includes('Sent a video') && !message.replyTo.content.includes('Sent an attachment') && (
                            <p className="text-[13px] text-[#6b7280] truncate">
                                {message.replyTo.content}
                            </p>
                        )}
                        {message.replyTo.attachments && message.replyTo.attachments.length > 0 && (
                            <p className="text-[13px] text-[#6b7280] truncate">
                                {message.replyTo.attachments.length === 1 
                                    ? `📎 ${message.replyTo.attachments[0].filename}`
                                    : `📎 ${message.replyTo.attachments.length} files`
                                }
                            </p>
                        )}
                        {!message.replyTo.content && (!message.replyTo.attachments || message.replyTo.attachments.length === 0) && (
                            <p className="text-[13px] text-[#6b7280] truncate italic">
                                Media
                            </p>
                        )}
                    </div>
                )}

                {isDeleted ? (
                    <p className="text-sm italic text-[#6b7280]">
                        This message was deleted
                    </p>
                ) : (
                    <>
                        {/* Show forwarded attachments if available */}
                        {message.forwardedFromMessage?.attachments && message.forwardedFromMessage.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {message.forwardedFromMessage.attachments.length > 1 && (
                                    <div className="mb-2 flex justify-end">
                                        <button
                                            onClick={async () => {
                                                const getFullUrl = (url: string) => {
                                                    if (url.startsWith('http://') || url.startsWith('https://')) {
                                                        return url;
                                                    }
                                                    const apiBaseURL = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                                                        ? `http://${window.location.hostname}:3001`
                                                        : 'http://localhost:3001';
                                                    return `${apiBaseURL}${url}`;
                                                };

                                                // Download all forwarded attachments using blob download
                                                for (const attachment of message.forwardedFromMessage.attachments || []) {
                                                    try {
                                                        const fullUrl = getFullUrl(attachment.url);
                                                        const response = await fetch(fullUrl);
                                                        if (!response.ok) continue;
                                                        
                                                        const blob = await response.blob();
                                                        const blobUrl = window.URL.createObjectURL(blob);
                                                        
                                                        const link = document.createElement('a');
                                                        link.href = blobUrl;
                                                        link.download = attachment.filename;
                                                        link.style.display = 'none';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        
                                                        window.URL.revokeObjectURL(blobUrl);
                                                    } catch (error) {
                                                        console.error(`Failed to download ${attachment.filename}:`, error);
                                                        // Fallback to direct download
                                                        const fullUrl = getFullUrl(attachment.url);
                                                        const link = document.createElement('a');
                                                        link.href = fullUrl;
                                                        link.download = attachment.filename;
                                                        link.style.display = 'none';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }
                                                    await new Promise(resolve => setTimeout(resolve, 200));
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-[#17a74a] hover:bg-[#159a42] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="7 10 12 15 17 10"/>
                                                <line x1="12" y1="15" x2="12" y2="3"/>
                                            </svg>
                                            Download All ({message.forwardedFromMessage.attachments.length})
                                        </button>
                                    </div>
                                )}
                                {message.forwardedFromMessage.attachments.map((attachment) => (
                                    <AttachmentPreview key={attachment.id} attachment={attachment} />
                                ))}
                            </div>
                        )}

                        {message.content && !message.content.includes('Sent an image') && !message.content.includes('Sent a video') && !message.content.includes('Sent an attachment') && (
                            <p className="text-[14.2px] text-[#111b21] whitespace-pre-wrap break-words leading-[19px] message-text">
                                {message.content}
                            </p>
                        )}

                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {message.attachments.length > 1 && (
                                    <div className="mb-2 flex justify-end">
                                        <button
                                            onClick={async () => {
                                                const getFullUrl = (url: string) => {
                                                    if (url.startsWith('http://') || url.startsWith('https://')) {
                                                        return url;
                                                    }
                                                    const apiBaseURL = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                                                        ? `http://${window.location.hostname}:3001`
                                                        : 'http://localhost:3001';
                                                    return `${apiBaseURL}${url}`;
                                                };

                                                // Download all attachments using blob download
                                                for (const attachment of message.attachments || []) {
                                                    try {
                                                        const fullUrl = getFullUrl(attachment.url);
                                                        const response = await fetch(fullUrl);
                                                        if (!response.ok) continue;
                                                        
                                                        const blob = await response.blob();
                                                        const blobUrl = window.URL.createObjectURL(blob);
                                                        
                                                        const link = document.createElement('a');
                                                        link.href = blobUrl;
                                                        link.download = attachment.filename;
                                                        link.style.display = 'none';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        
                                                        window.URL.revokeObjectURL(blobUrl);
                                                    } catch (error) {
                                                        console.error(`Failed to download ${attachment.filename}:`, error);
                                                        // Fallback to direct download
                                                        const fullUrl = getFullUrl(attachment.url);
                                                        const link = document.createElement('a');
                                                        link.href = fullUrl;
                                                        link.download = attachment.filename;
                                                        link.style.display = 'none';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }
                                                    // Small delay between downloads
                                                    await new Promise(resolve => setTimeout(resolve, 200));
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-[#005d99] hover:bg-[#004d7a] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="7 10 12 15 17 10"/>
                                                <line x1="12" y1="15" x2="12" y2="3"/>
                                            </svg>
                                            Download All ({message.attachments.length})
                                        </button>
                                    </div>
                                )}
                                {message.attachments.map((attachment) => (
                                    <AttachmentPreview key={attachment.id} attachment={attachment} />
                                ))}
                            </div>
                        )}

                        {message.voiceNote && (
                            <div className="mt-2">
                                <audio
                                    src={message.voiceNote.url}
                                    controls
                                    className="w-full max-w-xs"
                                />
                            </div>
                        )}

                        {message.reactions && message.reactions.length > 0 && (
                            <div className="mt-[6px] flex flex-wrap gap-1">
                                {Object.entries(
                                    message.reactions.reduce((acc, reaction) => {
                                        if (!acc[reaction.emoji]) {
                                            acc[reaction.emoji] = [];
                                        }
                                        acc[reaction.emoji].push(reaction);
                                        return acc;
                                    }, {} as Record<string, typeof message.reactions>)
                                ).map(([emoji, reactions]) => {
                                    const hasUserReaction = reactions.some(
                                        (r) => r.userId === currentUser?.id
                                    );
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (hasUserReaction && onRemoveReaction) {
                                                    handleRemoveReaction(emoji);
                                                } else if (onReaction) {
                                                    handleReaction(emoji);
                                                }
                                            }}
                                            className={`px-2 py-[2px] rounded-xl text-xs flex items-center gap-1 border border-[#e5e5e5] bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                                                hasUserReaction
                                                    ? 'bg-[#e3f2fd] border-[#005d99]'
                                                    : 'bg-white'
                                            }`}
                                        >
                                            <span>{emoji}</span>
                                            <span className="font-semibold">{reactions.length}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                <div className={`flex items-center gap-[3px] mt-1 message-footer ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {/* Forwarded indicator icon */}
                    {/* Forwarded message indicator */}
                    {message.forwardedFromMessage && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#17a74a] w-3.5 h-3.5 mr-0.5 flex-shrink-0" aria-label="Forwarded message">
                            <polyline points="13 17 18 12 13 7"/>
                            <polyline points="6 17 11 12 6 7"/>
                        </svg>
                    )}
                    <span className="text-[11px] text-[#667781] whitespace-nowrap message-time">
                        {format(new Date(message.createdAt), 'h:mm a')}
                    </span>
                    {isMe && (
                        <span className={`inline-flex items-center checkmarks ${message.seenAt ? 'text-[#53bdeb]' : message.deliveredAt ? 'text-[#667781]' : 'text-[#667781]'}`}>
                            {message.seenAt ? (
                                <svg viewBox="0 0 16 15" fill="currentColor" className="w-4 h-[15px]">
                                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                                </svg>
                            ) : message.deliveredAt ? (
                                <svg viewBox="0 0 16 15" fill="currentColor" className="w-4 h-[15px]">
                                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                                </svg>
                            ) : (
                                <FaCheck className="text-[11px] w-3 h-3" />
                            )}
                        </span>
                    )}
                    {message.isPinned && (
                        <FaThumbtack className="text-[11px] text-yellow-500 ml-1" />
                    )}
                </div>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <div
                            className={`absolute z-50 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-dark-paper border border-gray-200 dark:border-gray-700 ${
                                isMe ? 'right-0' : 'left-0'
                            }`}
                        >
                            {onReply && !isDeleted && (
                                <button
                                    onClick={() => {
                                        onReply(message);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M9 14L4 9l5-5"/>
                                        <path d="M20 20v-7a4 4 0 00-4-4H4"/>
                                    </svg>
                                    <span>Reply</span>
                                </button>
                            )}
                            {!isDeleted && (
                                <button
                                    onClick={() => {
                                        setShowReactionPicker(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                                    </svg>
                                    <span>React</span>
                                </button>
                            )}
                            {onForward && !isDeleted && (
                                <button
                                    onClick={() => {
                                        onForward(message);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <polyline points="13 17 18 12 13 7"/>
                                        <polyline points="6 17 11 12 6 7"/>
                                    </svg>
                                    <span>Forward</span>
                                </button>
                            )}
                            {onPin && (
                                <button
                                    onClick={() => {
                                        if (onPin) {
                                            onPin(message.id, !message.isPinned);
                                        }
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <FaThumbtack />
                                    <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                                </button>
                            )}
                            {onDelete && isMe && (
                                <>
                                    <button
                                        onClick={() => handleDelete(false)}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center space-x-2"
                                    >
                                        <FaTrash />
                                        <span>Delete for me</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(true)}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center space-x-2"
                                    >
                                        <FaTrash />
                                        <span>Delete for everyone</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}

                {showReactionPicker && (
                    <div className={`absolute ${isMe ? 'right-2 top-12' : 'left-2 top-12'} z-50`}>
                        <ReactionPicker
                            onEmojiSelect={handleReaction}
                            existingReactions={message.reactions}
                            currentUserId={currentUser?.id}
                            onRemoveReaction={(emoji) => handleRemoveReaction(emoji)}
                            isOpen={true}
                            onClose={() => setShowReactionPicker(false)}
                        />
                    </div>
                )}
                </div>
            </div>
            
            {/* Avatar for sent messages - appears last */}
            {isMe && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-[13px] flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
            )}
        </div>
    );
};

export default MessageBubble;

