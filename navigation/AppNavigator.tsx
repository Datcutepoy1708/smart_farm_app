import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../store/authStore';
import { COLORS } from '../constants/config';
import DrawerNavigator from './DrawerNavigator';
import { navigationRef } from './navigationRef';
import { socketService } from '../services/socket';
import { alertApi } from '../services/api';
import { useAlertStore } from '../store/alertStore';
import { registerForPushNotifications } from '../services/notificationService';

import LoginScreen        from '../screens/auth/LoginScreen';
import RegisterScreen     from '../screens/auth/RegisterScreen';
import CreateNoteScreen   from '../screens/notes/CreateNoteScreen';
import UpdateNoteScreen   from '../screens/notes/UpdateNoteScreen';
import ScheduleNoteScreen from '../screens/notes/ScheduleNoteScreen';
import SplashScreen       from '../screens/splash/SplashScreen';

// ─── Global Notification Handler ─────────────────────────────────────────────
// Cho phép hiển thị alert + sound + badge ngay cả khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

const Stack = createNativeStackNavigator();

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

const AppNavigator = () => {
  const { user, token, isLoading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  const incrementUnread = useAlertStore((state) => state.incrementUnread);
  const setUnreadCount = useAlertStore((state) => state.setUnreadCount);

  // Khi user đăng nhập → kết nối socket và join farm room
  React.useEffect(() => {
    if (user && token) {
      socketService.connect(token);
      
      // Lấy số thông báo chưa đọc (barnId = 1)
      alertApi.getUnreadCount(1)
        .then((res) => setUnreadCount(res.data.unreadCount))
        .catch(console.error);

      // Đăng ký nhận thông báo đẩy qua Expo khi app khởi động (background/lockscreen)
      registerForPushNotifications().catch(console.warn);

      // Join đúng room theo userId — backend lắng nghe 'join:farm'
      setTimeout(() => {
        socketService.joinFarm(user.id);
      }, 500);

      // Lắng nghe socket alert:new toàn cục
      socketService.onNewAlert(async (newAlert: any) => {
        incrementUnread();
        
        try {
          // Bắn thông báo Local ngay lập tức
          await Notifications.scheduleNotificationAsync({
            content: {
              title: newAlert.alertType === 'fire' ? '🔥 CẢNH BÁO CHÁY KHẨN CẤP' 
                   : newAlert.alertType === 'toxic_gas' ? '☠️ CẢNH BÁO KHÍ ĐỘC'
                   : newAlert.alertType === 'feed_error' || newAlert.alertType === 'feed_insufficient' ? '⚠️ CẢNH BÁO CHO ĂN'
                   : '⚠️ CẢNH BÁO HỆ THỐNG',
              body: newAlert.message || 'Phát hiện bất thường tại chuồng nuôi!',
              data: { type: 'alert', alertId: newAlert.id },
              sound: true,
            },
            trigger: null, // Kích hoạt ngay lập tức
          });
        } catch (err) {
          console.error('Lỗi hiển thị thông báo:', err);
        }
        
        // Hiển thị thêm hộp thoại trực tiếp trên màn hình (để đảm bảo không bị sót)
        import('react-native').then(({ Alert }) => {
          Alert.alert(
            newAlert.alertType === 'fire' ? '🔥 CHÁY KHẨN CẤP' : '⚠️ CẢNH BÁO',
            newAlert.message || 'Có bất thường tại chuồng!'
          );
        });
      });

    } else {
      socketService.disconnect();
    }

    return () => {
      // Cleanup listener khi unmount hoặc đăng xuất
      socketService.offNewAlert(() => {});
    };
  }, [user, token, incrementUnread, setUnreadCount]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // ─── Notification Listeners ───────────────────────────────────────────────
  React.useEffect(() => {
    // Khi nhận notification lúc app đang mở
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification.request.content.title);
      },
    );

    // Khi user bấm vào notification → navigate tới Notes
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          type?: string;
          noteId?: number;
        };
        if (data.type === 'reminder') {
          // Navigate tới Notes screen thông qua Navigation ref
          navigationRef.current?.navigate('Main' as never);
        }
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={DrawerNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateNote"
              component={CreateNoteScreen}
              options={{
                title: 'Thêm ghi chú',
                presentation: 'modal',
                headerShown:false,
                headerStyle: {
                  backgroundColor: COLORS.primary,
                },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen
              name="UpdateNote"
              component={UpdateNoteScreen}
              options={{
                title: 'Chỉnh sửa ghi chú',
                presentation: 'modal',
                headerShown: false,
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen
              name="ScheduleNote"
              component={ScheduleNoteScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
});

export default AppNavigator;

