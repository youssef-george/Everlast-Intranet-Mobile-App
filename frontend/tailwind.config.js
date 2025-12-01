/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#005d99', // Deep Blue
                    dark: '#004a7a',
                    light: '#007acc',
                },
                secondary: {
                    DEFAULT: '#17a74a', // Green
                    dark: '#128c4e',
                    light: '#25d366',
                },
                accent: '#34b7f1',
                danger: '#ef5350',

                // Dark mode specific
                dark: {
                    bg: '#0b141a',
                    paper: '#1f2c34',
                    hover: '#2a3942',
                    text: '#e9edef',
                    muted: '#8696a0',
                    incoming: '#1f2c34',
                    outgoing: '#005c4b',
                },
                // Light mode specific
                light: {
                    bg: '#f5f5f5',
                    paper: '#ffffff',
                    hover: '#f5f6f6',
                    text: '#1f2937',
                    muted: '#667781',
                    incoming: '#ffffff',
                    outgoing: '#d9fdd3',
                }
            },
            backgroundImage: {
                'chat-pattern-light': "url('/chat-bg-light.png')",
                'chat-pattern-dark': "url('/chat-bg-dark.png')",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
