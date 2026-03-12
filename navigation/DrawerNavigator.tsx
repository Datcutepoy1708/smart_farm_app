import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/authStore';
import { COLORS } from '../constants/config';
import BottomTabNavigator from './BottomTabNavigator';
import PlaceholderScreen from '../screens/placeholder/PlaceholderScreen';
import LogoutScreen from '../screens/auth/LogoutScreen';
import NutritionScreen from '../screens/placeholder/NutritionScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import FeedAnalysisScreen from '../screens/feed/FeedAnalysisScreen';
import NotesScreen from '../screens/notes/NotesScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import FarmAIScreen from '@/screens/farmai/FarmAIScreen';

export type DrawerParamList = {
  MainTabs: undefined;
  Overview: undefined;
  Camera: undefined;
  FeedAnalysis: undefined;
  Nutrition: undefined;
  Notes: undefined;
  Schedule: undefined;
  Settings: undefined;
  Logout: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const OverviewScreen: React.FC = () => <PlaceholderScreen title="Tổng quan" />;

const CameraScreen: React.FC = () => <PlaceholderScreen title="Camera / YOLO" />;

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  target: keyof DrawerParamList;
  isLogout?: boolean;
}

const DrawerContent: React.FC<DrawerContentComponentProps> = ({ navigation, state }) => {
  const { user } = useAuth();

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      title: 'Tổng quan',
      icon: 'grid',
      target: 'Overview',
    },
    {
      id: 'camera',
      title: 'Camera / YOLO',
      icon: 'camera',
      target: 'Camera',
    },
    {
      id: 'feed',
      title: 'Thức ăn',
      icon: 'restaurant',
      target: 'FeedAnalysis',
    },
    {
      id: 'nutrition',
      title: 'Dinh dưỡng',
      icon: 'leaf',
      target: 'Nutrition',
    },
    {
      id: 'notes',
      title: 'Ghi chú',
      icon: 'document-text',
      target: 'Notes',
    },
    {
      id: 'schedule',
      title: 'Lịch hẹn giờ',
      icon: 'time',
      target: 'Schedule',
    },
    {
      id: 'settings',
      title: 'Cài đặt',
      icon: 'settings',
      target: 'Settings',
    },
    {
      id: 'logout',
      title: 'Đăng xuất',
      icon: 'log-out',
      target: 'Logout',
      isLogout: true,
    },
  ];

  const currentRouteName = state.routeNames[state.index];

  const handleItemPress = (item: MenuItem) => {
    if (item.target === 'Overview') {
      navigation.navigate('Overview');
    } else {
      navigation.navigate(item.target as keyof DrawerParamList);
    }
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={COLORS.white} />
        </View>
        <Text style={styles.userName}>{user?.fullName ?? 'Người dùng'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? 'user@example.com'}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => {
          const isActive = currentRouteName === item.target;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => handleItemPress(item)}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={item.isLogout ? COLORS.danger : isActive ? COLORS.primary : COLORS.text}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.isLogout && styles.menuItemTextLogout,
                  isActive && styles.menuItemTextActive,
                ]}
              >
                {item.title}
              </Text>
              {!item.isLogout && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 280,
          backgroundColor: COLORS.white,
        },
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.4)',
        headerShown: false,
        swipeEnabled: true,
        sceneContainerStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ drawerLabel: 'Trang chủ' }}
      />
      <Drawer.Screen
        name="Overview"
        component={OverviewScreen}
        options={{ drawerLabel: 'Tổng quan' }}
      />
      <Drawer.Screen
        name="Camera"
        component={CameraScreen}
        options={{ drawerLabel: 'Camera / YOLO' }}
      />
      <Drawer.Screen
        name="FeedAnalysis"
        component={FeedAnalysisScreen}
        options={{ drawerLabel: 'Thức ăn' }}
      />
      <Drawer.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ drawerLabel: 'Dinh dưỡng' }}
      />
      <Drawer.Screen
        name="Notes"
        component={NotesScreen}
        options={{ drawerLabel: 'Ghi chú' }}
      />
      <Drawer.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ drawerLabel: 'Lịch hẹn giờ' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ drawerLabel: 'Cài đặt' }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ drawerLabel: 'Đăng xuất' }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuItemActive: {
    backgroundColor: '#E3F2E6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 15,
  },
  menuItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuItemTextLogout: {
    color: COLORS.danger,
  },
});

export default DrawerNavigator;

