import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Start with system theme
        const systemTheme = Appearance.getColorScheme();
        return (systemTheme === 'dark' ? 'dark' : 'light');
    });

    useEffect(() => {
        // Load saved theme preference
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme');
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setTheme(savedTheme);
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            }
        };

        loadTheme();

        // Listen for system theme changes
        const subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
            // Only update if user hasn't set a preference
            AsyncStorage.getItem('theme').then((savedTheme) => {
                if (!savedTheme && colorScheme) {
                    setTheme(colorScheme === 'dark' ? 'dark' : 'light');
                }
            });
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        // Save theme preference
        AsyncStorage.setItem('theme', theme).catch((error) => {
            console.error('Error saving theme:', error);
        });
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};


