/**
 * Utility function to convert relative image URLs to full URLs
 * Handles profile pictures, group pictures, and other uploaded images
 */
export const getImageUrl = (imagePath?: string | null): string | null => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // If it's a relative path starting with /, construct full URL
    if (imagePath.startsWith('/')) {
        if (typeof window !== 'undefined') {
            const isProduction = import.meta.env.PROD;
            
            if (isProduction) {
                // In production, frontend is served from backend, so use relative URLs
                return imagePath;
            }
            
            // Development mode - use hostname-based URL for network access
            const hostname = window.location.hostname;
            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                return `http://${hostname}:3001${imagePath}`;
            }
            return `http://localhost:3001${imagePath}`;
        }
    }
    
    // Return as-is if it doesn't match any pattern
    return imagePath;
};
