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

    const getFullUrl = (url: string) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Convert relative URL to full URL
        const apiBaseURL = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
            ? `http://${window.location.hostname}:3001`
            : 'http://localhost:3001';
        return `${apiBaseURL}${url}`;
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const fullUrl = getFullUrl(attachment.url);
            
            // Fetch the file as a blob to ensure download instead of opening
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch file');
            }
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = attachment.filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            if (onDownload) {
                onDownload();
            }
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to direct download link
            const fullUrl = getFullUrl(attachment.url);
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = attachment.filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const isImage = attachment.type === 'IMAGE';
    const isVideo = attachment.type === 'VIDEO';
    const fullUrl = getFullUrl(attachment.url);

    return (
        <div className="mt-2 rounded-lg overflow-hidden relative group">
            {isImage ? (
                <div className="relative">
                    <img
                        src={fullUrl}
                        alt={attachment.filename}
                        className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                            // Allow clicking image to view, but download button takes priority
                            if (!(e.target as HTMLElement).closest('button')) {
                                window.open(fullUrl, '_blank', 'noopener,noreferrer');
                            }
                        }}
                    />
                    <button
                        onClick={handleDownload}
                        className="absolute bottom-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 flex items-center justify-center z-10"
                        title="Download"
                    >
                        <FaDownload className="text-[#005d99] w-4 h-4" />
                    </button>
                </div>
            ) : isVideo ? (
                <div className="relative">
                    <video
                        src={fullUrl}
                        controls
                        className="max-w-full max-h-64 rounded-lg"
                    >
                        Your browser does not support the video tag.
                    </video>
                    <button
                        onClick={handleDownload}
                        className="absolute bottom-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 flex items-center justify-center z-10"
                        title="Download"
                    >
                        <FaDownload className="text-[#005d99] w-4 h-4" />
                    </button>
                </div>
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
                    <button
                        onClick={handleDownload}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#005d99] transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Download"
                    >
                        <FaDownload className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AttachmentPreview;

