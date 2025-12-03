import React, { useState } from 'react';
import { FaSmile } from 'react-icons/fa';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ReactionPickerProps {
    onEmojiSelect: (emoji: string) => void;
    existingReactions?: Array<{ emoji: string; userId: string; user?: { name: string } }>;
    currentUserId?: string;
    onRemoveReaction?: (emoji: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({
    onEmojiSelect,
    existingReactions = [],
    currentUserId,
    onRemoveReaction,
    isOpen = false,
    onClose,
}) => {
    const [showPicker, setShowPicker] = useState(isOpen);
    
    React.useEffect(() => {
        setShowPicker(isOpen);
    }, [isOpen]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onEmojiSelect(emojiData.emoji);
        setShowPicker(false);
        if (onClose) {
            onClose();
        }
    };
    
    const handleClose = () => {
        setShowPicker(false);
        if (onClose) {
            onClose();
        }
    };

    const groupedReactions = existingReactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
    }, {} as Record<string, typeof existingReactions>);

    return (
        <div className="relative">
            {showPicker && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={handleClose}
                    />
                    <div className="absolute bottom-full left-0 mb-2 z-50 shadow-lg rounded-lg overflow-hidden">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width={300}
                            height={400}
                            previewConfig={{ showPreview: false }}
                        />
                    </div>
                </>
            )}

            {existingReactions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1 bg-white dark:bg-dark-paper rounded-lg shadow-lg p-2 min-w-[200px] z-30">
                    {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                        const hasUserReaction = reactions.some((r) => r.userId === currentUserId);
                        return (
                            <button
                                key={emoji}
                                onClick={() => {
                                    if (hasUserReaction && onRemoveReaction) {
                                        onRemoveReaction(emoji);
                                    } else {
                                        onEmojiSelect(emoji);
                                    }
                                }}
                                className={`px-2 py-1 rounded-full text-sm flex items-center space-x-1 transition-colors ${
                                    hasUserReaction
                                        ? 'bg-primary/20 border-2 border-primary'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <span>{emoji}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {reactions.length}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReactionPicker;

