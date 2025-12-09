import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2 to access localhost
// For physical device, use your computer's IP address
// For iOS simulator, use localhost
const getApiBaseURL = () => {
    // In development, you can set this to your backend URL
    // For Android emulator: http://10.0.2.2:3001/api
    // For physical device: http://YOUR_COMPUTER_IP:3001/api
    // For iOS simulator: http://localhost:3001/api
    
    if (__DEV__) {
        if (Platform.OS === 'android') {
            // Android emulator uses 10.0.2.2 to access host machine's localhost
            return 'http://10.0.2.2:3001/api';
        } else if (Platform.OS === 'ios') {
            // iOS simulator can use localhost
            return 'http://localhost:3001/api';
        }
    }
    
    // Production - update this to your production backend URL
    return 'http://localhost:3001/api';
};

const api = axios.create({
    baseURL: getApiBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        
        // Suppress 404 errors for optional endpoints
        const isOptionalEndpoint = 
            url.includes('/notifications') || 
            url.includes('/chat/recent');
        
        if (error.response?.status === 404 && isOptionalEndpoint) {
            return Promise.resolve({ data: url.includes('unread-count') ? { count: 0 } : [] });
        }
        
        // Suppress console errors for connection issues
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

