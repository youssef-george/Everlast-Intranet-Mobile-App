// Centralized error handling utility

export interface AppError {
    message: string;
    code?: string;
    status?: number;
}

export const handleApiError = (error: any): AppError => {
    if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'An error occurred';

        switch (status) {
            case 400:
                return { message: 'Invalid request. Please check your input.', code: 'BAD_REQUEST', status };
            case 401:
                return { message: 'Unauthorized. Please try again.', code: 'UNAUTHORIZED', status };
            case 403:
                return { message: 'You do not have permission to perform this action.', code: 'FORBIDDEN', status };
            case 404:
                return { message: 'Resource not found.', code: 'NOT_FOUND', status };
            case 500:
                return { message: 'Server error. Please try again later.', code: 'SERVER_ERROR', status };
            default:
                return { message, code: 'API_ERROR', status };
        }
    } else if (error.request) {
        // Request made but no response
        return {
            message: 'Network error. Please check your connection.',
            code: 'NETWORK_ERROR',
        };
    } else {
        // Something else happened
        return {
            message: error.message || 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
        };
    }
};

export const showErrorToast = (error: AppError) => {
    // This would integrate with a toast notification library
    // For now, we'll use console and could extend to show UI notifications
    console.error('Error:', error.message);
    
    // You can integrate with react-toastify or similar here
    if (typeof window !== 'undefined' && window.alert) {
        // Fallback to alert for critical errors
        // In production, replace with proper toast notification
    }
};

export const formatError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unexpected error occurred';
};

