import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { COLORS } from '../constants/config';
import { useAlertStore } from '../store/alertStore';

import DashboardScreen from '../screens/dashboard/DashboardScreen';

import AlertScreen from '../screens/alerts/AlertScreen';
import FarmAIScreen from '../screens/farmai/FarmAIScreen';
import DevicesScreen from '@/screens/devices/DevicesScreen';

type BottomTabParamList = {
  Dashboard: undefined;
  Devices: undefined;
  FarmAI: undefined;
  Alerts: undefined;
  Menu: undefined;
};

type RootDrawerParamList = {
  MainTabs: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const FarmAITabButton: React.FC<BottomTabBarButtonProps> = ({ children, onPress, accessibilityState }) => {
  const isSelected = accessibilityState?.selected ?? false;

  return (
    <TouchableOpacity
      style={styles.farmAIBtn}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityState={accessibilityState}
    >
      <View style={[styles.farmAIIcon, isSelected && styles.farmAIIconActive]}>{children}</View>
    </TouchableOpacity>
  );
};

const MenuTabButton: React.FC<BottomTabBarButtonProps> = ({ children, accessibilityState }) => {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

  return (
    <TouchableOpacity
      style={styles.menuBtn}
      onPress={() => navigation.openDrawer()}
      activeOpacity={0.8}
      accessibilityState={accessibilityState}
    >
      {children}
    </TouchableOpacity>
  );
};

const BottomTabNavigator: React.FC = () => {
  const unreadCount = useAlertStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color }) => {
          switch (route.name) {
            case 'Dashboard':
              return <Ionicons name="home" size={24} color={color} />;
            case 'Devices':
              return <Ionicons name="hardware-chip" size={24} color={color} />;
            case 'Alerts':
              return <Ionicons name="notifications" size={24} color={color} />;
            case 'Menu':
              return <Ionicons name="menu" size={24} color={color} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 65,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Trang chủ',
        }}
      />
      <Tab.Screen
        name="Devices"
        component={DevicesScreen}
        options={{
          title: 'Thiết bị',
        }}
      />
      <Tab.Screen
        name="FarmAI"
        component={FarmAIScreen}
        options={{
          title: 'FarmAI',
          tabBarButton: (props) => (
            <FarmAITabButton {...props}>
              <Ionicons name="chatbubble-ellipses" size={30} color={COLORS.white} />
            </FarmAITabButton>
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertScreen}
        options={{
          title: 'Cảnh báo',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.danger,
            color: COLORS.white,
            fontSize: 10,
            minWidth: 18,
            height: 18,
          },
        }}
      />
      <Tab.Screen
        name="Menu"
        component={DashboardScreen}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.getParent()?.openDrawer();
          },
        })}
        options={{
          title: 'Menu',
          tabBarButton: (props) => (
            <MenuTabButton {...props}>
              <Ionicons name="menu" size={24} color={COLORS.gray} />
            </MenuTabButton>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  farmAIBtn: {
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  farmAIIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmAIIconActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  menuBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomTabNavigator;

