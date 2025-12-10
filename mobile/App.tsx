import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function App(): React.JSX.Element {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <SafeAreaProvider>
                        <ThemeProvider>
                            <AuthProvider>
                                <SocketProvider>
                                    <NotificationsProvider>
                                        <AppNavigator />
                                    </NotificationsProvider>
                                </SocketProvider>
                            </AuthProvider>
                        </ThemeProvider>
                    </SafeAreaProvider>
                </GestureHandlerRootView>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;


