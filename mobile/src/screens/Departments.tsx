import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Departments: React.FC = () => {
    const { theme } = useTheme();
    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Departments</Text>
            <Text style={styles.subtext}>Screen coming soon...</Text>
        </View>
    );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme === 'dark' ? '#ffffff' : '#000000',
    },
    subtext: {
        fontSize: 16,
        color: theme === 'dark' ? '#aaaaaa' : '#666666',
        marginTop: 8,
    },
});

export default Departments;

