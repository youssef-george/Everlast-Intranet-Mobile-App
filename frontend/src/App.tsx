import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationsProvider } from './context/NotificationsContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import UserSelector from './components/UserSelector';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import MembersDirectory from './pages/MembersDirectory';
import EmployeeProfile from './pages/EmployeeProfile';
import Chats from './pages/Chats';
import ChatWindow from './pages/ChatWindow';
import MessagesPage from './pages/MessagesPage';
import Groups from './pages/Groups';
import GroupInfo from './pages/GroupInfo';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Departments from './pages/Departments';
import QuickLinksPage from './pages/QuickLinksPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading, showUserSelector, loginAs } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (showUserSelector || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <UserSelector onSelect={loginAs} currentUserId={currentUser?.id} />
      </div>
    );
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute>
            <Navigate to="/members" replace />
          </ProtectedRoute>
        } />
        <Route path="members" element={
          <ProtectedRoute>
            <MembersDirectory />
          </ProtectedRoute>
        } />
        <Route path="members/:id" element={
          <ProtectedRoute>
            <EmployeeProfile />
          </ProtectedRoute>
        } />
        <Route path="messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="messages/:id" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="chats" element={
          <ProtectedRoute>
            <Chats />
          </ProtectedRoute>
        } />
        <Route path="chats/:id" element={
          <ProtectedRoute>
            <ChatWindow />
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="departments" element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        } />
        <Route path="quick-links" element={
          <ProtectedRoute>
            <QuickLinksPage />
          </ProtectedRoute>
        } />
        <Route path="groups" element={
          <ProtectedRoute>
            <Groups />
          </ProtectedRoute>
        } />
        <Route path="groups/:id" element={
          <ProtectedRoute>
            <ChatWindow isGroup />
          </ProtectedRoute>
        } />
        <Route path="groups/:id/info" element={
          <ProtectedRoute>
            <GroupInfo />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="profile/:id" element={
          <ProtectedRoute>
            <EmployeeProfile />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationsProvider>
                <Router>
                  <AppRoutes />
                  <PWAInstallPrompt />
                </Router>
              </NotificationsProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
