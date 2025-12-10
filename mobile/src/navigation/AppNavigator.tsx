import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Screens (will be created)
import MembersDirectory from '../screens/MembersDirectory';
import EmployeeProfile from '../screens/EmployeeProfile';
import Chats from '../screens/Chats';
import ChatWindow from '../screens/ChatWindow';
import MessagesPage from '../screens/MessagesPage';
import Groups from '../screens/Groups';
import GroupInfo from '../screens/GroupInfo';
import Profile from '../screens/Profile';
import Notifications from '../screens/Notifications';
import Departments from '../screens/Departments';
import QuickLinksPage from '../screens/QuickLinksPage';
import UserSelector from '../components/UserSelector';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Main Tab Navigator
function MainTabs() {
    const { theme } = useTheme();
    const iconColor = theme === 'dark' ? '#ffffff' : '#000000';
    const activeTintColor = '#005d99';
    const inactiveTintColor = '#666666';

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: activeTintColor,
                tabBarInactiveTintColor: inactiveTintColor,
                tabBarStyle: {
                    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                    borderTopColor: theme === 'dark' ? '#333333' : '#e0e0e0',
                },
            }}
        >
            <Tab.Screen
                name="MembersTab"
                component={MembersDirectory}
                options={{
                    tabBarLabel: 'Members',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ChatsTab"
                component={Chats}
                options={{
                    tabBarLabel: 'Chats',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="chat" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="GroupsTab"
                component={Groups}
                options={{
                    tabBarLabel: 'Groups',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="group" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="NotificationsTab"
                component={Notifications}
                options={{
                    tabBarLabel: 'Notifications',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="notifications" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// Main Stack Navigator
function MainStack() {
    const { theme } = useTheme();
    const headerStyle = {
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    };
    const headerTintColor = theme === 'dark' ? '#ffffff' : '#000000';

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle,
                headerTintColor,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="EmployeeProfile"
                component={EmployeeProfile}
                options={{ title: 'Employee Profile' }}
            />
            <Stack.Screen
                name="ChatWindow"
                component={ChatWindow}
                options={{ title: 'Chat' }}
            />
            <Stack.Screen
                name="MessagesPage"
                component={MessagesPage}
                options={{ title: 'Messages' }}
            />
            <Stack.Screen
                name="GroupInfo"
                component={GroupInfo}
                options={{ title: 'Group Info' }}
            />
            <Stack.Screen
                name="Profile"
                component={Profile}
                options={{ title: 'My Profile' }}
            />
            <Stack.Screen
                name="Departments"
                component={Departments}
                options={{ title: 'Departments' }}
            />
            <Stack.Screen
                name="QuickLinks"
                component={QuickLinksPage}
                options={{ title: 'Quick Links' }}
            />
        </Stack.Navigator>
    );
}

// Root Navigator with Auth
export default function AppNavigator() {
    const { currentUser, isLoading, showUserSelector, loginAs } = useAuth();
    const { theme } = useTheme();

    if (isLoading) {
        return null; // Or a loading screen
    }

    if (showUserSelector || !currentUser) {
        return (
            <UserSelector
                onSelect={loginAs}
                currentUserId={currentUser?.id}
            />
        );
    }

    return (
        <NavigationContainer
            theme={{
                dark: theme === 'dark',
                colors: {
                    primary: '#005d99',
                    background: theme === 'dark' ? '#000000' : '#ffffff',
                    card: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                    text: theme === 'dark' ? '#ffffff' : '#000000',
                    border: theme === 'dark' ? '#333333' : '#e0e0e0',
                    notification: '#005d99',
                },
            }}
        >
            <MainStack />
        </NavigationContainer>
    );
}


