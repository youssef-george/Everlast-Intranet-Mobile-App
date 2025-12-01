import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaCheck, FaCheckDouble, FaReply, FaTrash, FaThumbtack, FaSmile } from 'react-icons/fa';
import type { Message, User } from '../types';
import AttachmentPreview from './AttachmentPreview';
import ReactionPicker from './ReactionPicker';

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    currentUser?: User | null;
    onReply?: (message: Message) => void;
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
    onDelete,
    onPin,
    onReaction,
    onRemoveReaction,
    showSenderName = false,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    const handleLongPress = () => {
        setShowMenu(true);
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

    return (
        <div
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3 w-full group`}
            onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress();
            }}
        >
            {!isMe && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {message.sender?.name ? message.sender.name.charAt(0).toUpperCase() : 'U'}
                </div>
            )}
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[65%]`}>
                <div
                    className={`rounded-xl px-3.5 py-2.5 relative ${
                        isMe
                            ? 'bg-[#d9fdd3] rounded-br-sm'
                            : 'bg-white rounded-bl-sm'
                    }`}
                >
                {showSenderName && !isMe && message.sender && (
                    <p className="text-xs font-bold text-orange-500 mb-1">
                        {message.sender.name}
                    </p>
                )}

                {message.replyTo && (
                    <div className="mb-2 pl-3 border-l-[3px] border-[#005d99] bg-[rgba(0,93,153,0.1)] rounded py-2">
                        <p className="text-[13px] font-semibold text-[#005d99] mb-0.5">
                            {message.replyTo.sender?.name || 'User'}
                        </p>
                        <p className="text-[13px] text-[#6b7280] truncate">
                            {message.replyTo.content || 'Sent an attachment'}
                        </p>
                    </div>
                )}

                {isDeleted ? (
                    <p className="text-sm italic text-[#6b7280]">
                        This message was deleted
                    </p>
                ) : (
                    <>
                        {message.content && (
                            <p className="text-sm text-[#1f2937] whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                            </p>
                        )}

                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
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
                            <div className="mt-1 flex flex-wrap gap-1">
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
                                            onClick={() => {
                                                if (hasUserReaction && onRemoveReaction) {
                                                    handleRemoveReaction(emoji);
                                                } else if (onReaction) {
                                                    handleReaction(emoji);
                                                }
                                            }}
                                            className={`px-2 py-0.5 rounded-xl text-xs flex items-center gap-1 border ${
                                                hasUserReaction
                                                    ? 'bg-white border-[#e5e5e5]'
                                                    : 'bg-white border-[#e5e5e5]'
                                            }`}
                                        >
                                            <span>{emoji}</span>
                                            <span>{reactions.length}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[11px] text-[#9ca3af]">
                        {format(new Date(message.createdAt), 'h:mm a')}
                    </span>
                    {isMe && (
                        <span className={`text-[11px] ${message.seenAt ? 'text-[#005d99]' : message.deliveredAt ? 'text-[#9ca3af]' : 'text-[#9ca3af]'}`}>
                            {message.seenAt ? (
                                <FaCheckDouble />
                            ) : message.deliveredAt ? (
                                <FaCheckDouble />
                            ) : (
                                <FaCheck />
                            )}
                        </span>
                    )}
                    {message.isPinned && (
                        <FaThumbtack className="text-[10px] text-yellow-500 ml-1" />
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
                            {onReply && (
                                <button
                                    onClick={() => {
                                        onReply(message);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <FaReply />
                                    <span>Reply</span>
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setShowReactionPicker(true);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                                <FaSmile />
                                <span>React</span>
                            </button>
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
                    <div className="absolute bottom-full left-0 mb-2 z-50">
                        <ReactionPicker
                            onEmojiSelect={handleReaction}
                            existingReactions={message.reactions}
                            currentUserId={currentUser?.id}
                            onRemoveReaction={(emoji) => handleRemoveReaction(emoji)}
                        />
                    </div>
                )}
                </div>
            </div>
            {isMe && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005d99] to-[#17a74a] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
            )}
        </div>
    );
};

export default MessageBubble;

