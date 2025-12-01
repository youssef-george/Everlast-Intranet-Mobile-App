import React, { useState } from 'react';
import { FaSmile } from 'react-icons/fa';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ReactionPickerProps {
    onEmojiSelect: (emoji: string) => void;
    existingReactions?: Array<{ emoji: string; userId: string; user?: { name: string } }>;
    currentUserId?: string;
    onRemoveReaction?: (emoji: string) => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({
    onEmojiSelect,
    existingReactions = [],
    currentUserId,
    onRemoveReaction,
}) => {
    const [showPicker, setShowPicker] = useState(false);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onEmojiSelect(emojiData.emoji);
        setShowPicker(false);
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
            <button
                onClick={() => setShowPicker(!showPicker)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                <FaSmile className="text-lg" />
            </button>

            {showPicker && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPicker(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 z-50">
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

