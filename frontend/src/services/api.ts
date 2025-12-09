import axios from 'axios';

// Use current hostname for API URL to support network access
const getApiBaseURL = () => {
    // In production (when served from backend), use relative URLs
    if (typeof window !== 'undefined') {
        // Check if we're in production (no Vite dev server)
        const isProduction = import.meta.env.PROD;
        
        if (isProduction) {
            // In production, frontend is served from backend, so use relative URLs
            return '/api';
        }
        
        // Development mode - use hostname-based URL for network access
        // Backend has global prefix '/api', so we need to include it
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return `http://${hostname}:3001/api`;
        }
    }
    return 'http://localhost:3001/api';
};

const api = axios.create({
    baseURL: getApiBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        
        // Suppress 404 errors for optional endpoints (notifications, chat/recent)
        const isOptionalEndpoint = 
            url.includes('/notifications') || 
            url.includes('/chat/recent');
        
        if (error.response?.status === 404 && isOptionalEndpoint) {
            // Return empty data for optional endpoints that don't exist
            return Promise.resolve({ data: url.includes('unread-count') ? { count: 0 } : [] });
        }
        
        // Suppress console errors for connection issues and 404s on critical endpoints
        // (these indicate backend is not running or endpoint is missing)
        const isConnectionIssue = 
            error.code === 'ERR_NETWORK' || 
            error.code === 'ECONNREFUSED' ||
            (error.response?.status === 404 && !isOptionalEndpoint);
        
        if (!isConnectionIssue) {
            const errorData = error.response?.data;
            const errorMessage = errorData?.message || errorData?.error || error.message || 'Unknown error';
            const errorStatus = error.response?.status;
            console.error('API Error:', {
                status: errorStatus,
                message: errorMessage,
                data: errorData,
                url: error.config?.url
            });
        }
        
        return Promise.reject(error);
    }
);

export default api;
