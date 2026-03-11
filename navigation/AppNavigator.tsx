import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../store/authStore';
import { COLORS } from '../constants/config';

// Import Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ThermalMonitorScreen from '../screens/dashboard/ThermalMonitorScreen';
import AlertScreen from '../screens/alerts/AlertScreen';
import ScheduleScreen from '../screens/schedules/ScheduleScreen';
import FeedAnalysisScreen from '../screens/feed/FeedAnalysisScreen';
import FarmAIScreen from '../screens/farm-ai/FarmAIScreen';
import DevicesScreen from '../screens/devices/DevicesScreen';
import NotesScreen from '../screens/notes/NotesScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'dashboard' : 'dashboard';
              break;
            case 'ThermalMonitor':
              iconName = focused ? 'whatshot' : 'whatshot';
              break;
            case 'Devices':
              iconName = focused ? 'devices' : 'devices';
              break;
            case 'FarmAI':
              iconName = focused ? 'smart-toy' : 'smart-toy';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications';
              break;
            case 'Notes':
              iconName = focused ? 'note' : 'note';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.lightGray,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: { backgroundColor: COLORS.background },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Tổng quan' }}
      />
      <Tab.Screen 
        name="ThermalMonitor" 
        component={ThermalMonitorScreen}
        options={{ title: 'Thermal' }}
      />
      <Tab.Screen 
        name="Devices" 
        component={DevicesScreen}
        options={{ title: 'Thiết bị' }}
      />
      <Tab.Screen 
        name="FarmAI" 
        component={FarmAIScreen}
        options={{ title: 'Farm AI' }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertScreen}
        options={{ title: 'Cảnh báo' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ title: 'Lịch' }}
      />
      <Tab.Screen 
        name="FeedAnalysis" 
        component={FeedAnalysisScreen}
        options={{ title: 'Thức ăn' }}
      />
      <Tab.Screen 
        name="Notes" 
        component={NotesScreen}
        options={{ title: 'Ghi chú' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
};

// Loading Screen Component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ marginTop: 16, color: COLORS.text, fontSize: 16 }}>Đang tải SmartFarm...</Text>
  </View>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Auth state is automatically restored from storage by persist middleware
      // Just need to simulate initialization delay
      setTimeout(() => {
        setIsInitializing(false);
      }, 1000);
    };

    init();
  }, []);

  if (isInitializing || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
