import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaPause } from 'react-icons/fa';
import api from '../services/api';

interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob, duration);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            intervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Microphone access denied. Please allow microphone access to record voice messages.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            setIsRecording(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPreview = () => {
        if (audioChunksRef.current.length > 0 && !isRecording) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.play();
            setIsPlaying(true);
        }
    };

    const handleStopPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <div className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {!isRecording ? (
                <>
                    <button
                        onClick={startRecording}
                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <FaMicrophone />
                    </button>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tap to record voice message</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        Cancel
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={stopRecording}
                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <FaStop />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 animate-pulse"
                                    style={{ width: `${Math.min((duration / 60) * 100, 100)}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                {formatTime(duration)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Send
                    </button>
                </>
            )}
        </div>
    );
};

export default VoiceRecorder;

