import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return <ErrorScreen error={this.state.error} />;
        }

        return this.props.children;
    }
}

const ErrorScreen: React.FC<{ error: Error | null }> = ({ error }) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const handleReload = () => {
        // In React Native, we can't reload like in web
        // Instead, we'll reset the error state
        // This would need to be handled by the parent component
        console.log('Reload requested');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Icon name="error-outline" size={64} color="#ff6b6b" />
                <Text style={styles.title}>Something went wrong</Text>
                <Text style={styles.message}>
                    {error?.message || 'An unexpected error occurred'}
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleReload}>
                    <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme === 'dark' ? '#000000' : '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: theme === 'dark' ? '#aaaaaa' : '#666666',
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#005d99',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ErrorBoundaryClass;

