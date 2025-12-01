import React from 'react';
import { FaFile, FaFilePdf, FaFileWord, FaImage, FaVideo, FaDownload } from 'react-icons/fa';
import type { Attachment } from '../types';

interface AttachmentPreviewProps {
    attachment: Attachment;
    onDownload?: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onDownload }) => {
    const getIcon = () => {
        switch (attachment.type) {
            case 'IMAGE':
                return <FaImage className="text-blue-500" />;
            case 'VIDEO':
                return <FaVideo className="text-purple-500" />;
            case 'PDF':
                return <FaFilePdf className="text-red-500" />;
            case 'WORD':
                return <FaFileWord className="text-blue-600" />;
            default:
                return <FaFile className="text-gray-500" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = attachment.type === 'IMAGE';
    const isVideo = attachment.type === 'VIDEO';

    return (
        <div className="mt-2 rounded-lg overflow-hidden">
            {isImage ? (
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    <img
                        src={attachment.url}
                        alt={attachment.filename}
                        className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    />
                </a>
            ) : isVideo ? (
                <video
                    src={attachment.url}
                    controls
                    className="max-w-full max-h-64 rounded-lg"
                >
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl">{getIcon()}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                            {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.size)}
                        </p>
                    </div>
                    <a
                        href={attachment.url}
                        download={attachment.filename}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                        onClick={onDownload}
                    >
                        <FaDownload />
                    </a>
                </div>
            )}
        </div>
    );
};

export default AttachmentPreview;

