import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { COLORS } from '../constants/config';
import { useAlertStore } from '../store/alertStore';

import DashboardScreen  from '../screens/dashboard/DashboardScreen';
import AlertScreen      from '../screens/alerts/AlertScreen';
import FarmAIScreen     from '../screens/farmai/FarmAIScreen';
import DevicesScreen    from '@/screens/devices/DevicesScreen';

type BottomTabParamList = {
  Dashboard: undefined;
  Devices:   undefined;
  FarmAI:    undefined;
  Alerts:    undefined;
  Menu:      undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// ─── Nút FarmAI (nổi lên giữa) ───────────────────────────────────────────────
const FarmAITabButton: React.FC<BottomTabBarButtonProps> = ({ children, onPress, accessibilityState }) => {
  const isSelected = accessibilityState?.selected ?? false;
  return (
    <TouchableOpacity
      style={styles.farmAIBtn}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityState={accessibilityState}
    >
      <View style={[styles.farmAIIcon, isSelected && styles.farmAIIconActive]}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

// ─── Nút Menu — mở Drawer qua getParent() trong listeners (không dùng hook riêng nữa) ─
const MenuPlaceholderScreen = () => <View />;

// ─────────────────────────────────────────────────────────────────────────────
const BottomTabNavigator: React.FC = () => {
  const unreadCount = useAlertStore((state) => state.unreadCount);
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Dashboard': return <Ionicons name="home"           size={size} color={color} />;
            case 'Devices':   return <Ionicons name="hardware-chip"  size={size} color={color} />;
            case 'Alerts':    return <Ionicons name="notifications"  size={size} color={color} />;
            case 'Menu':      return <Ionicons name="menu"           size={size} color={color} />;
            default:          return null;
          }
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth:  1,
          borderTopColor:  '#E0E0E0',
          height:          65 + (insets.bottom > 0 ? insets.bottom - 5 : 0),
          paddingBottom:   insets.bottom > 0 ? insets.bottom : 5,
          paddingTop:      5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        headerShown: false,
      })}
    >
      {/* 1. Trang chủ */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Trang chủ' }}
      />

      {/* 2. Thiết bị */}
      <Tab.Screen
        name="Devices"
        component={DevicesScreen}
        options={{ title: 'Thiết bị' }}
      />

      {/* 3. FarmAI — nút nổi giữa */}
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

      {/* 4. Cảnh báo */}
      <Tab.Screen
        name="Alerts"
        component={AlertScreen}
        options={{
          title: 'Cảnh báo',
          tabBarBadge:      unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.danger,
            color:           COLORS.white,
            fontSize:        10,
            minWidth:        18,
            height:          18,
          },
        }}
      />

      {/* 6. Menu — mở Drawer, FIX: dùng listeners thay vì hook riêng để tránh lỗi context */}
      <Tab.Screen
        name="Menu"
        component={MenuPlaceholderScreen}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            (navigation.getParent() as DrawerNavigationProp<Record<string, undefined>> | undefined)?.openDrawer();
          },
        })}
        options={{ title: 'Menu' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  farmAIBtn: {
    top: -15,
    justifyContent: 'center',
    alignItems:     'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  farmAIIcon: {
    width:  60,
    height: 60,
    borderRadius:       30,
    backgroundColor:    COLORS.primary,
    justifyContent:     'center',
    alignItems:         'center',
  },
  farmAIIconActive: {
    shadowColor:   COLORS.primary,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius:  6,
    elevation:     6,
  },
});

export default BottomTabNavigator;
