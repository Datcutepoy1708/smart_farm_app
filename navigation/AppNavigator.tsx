import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
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
      alertApi.getAll(1)
        .then((res) => {
          const alerts: any[] = res.data?.data ?? res.data ?? [];
          const unread = alerts.filter((a: any) => !a.isRead).length;
          setUnreadCount(unread);
        })
        .catch(console.error);

      registerForPushNotifications().catch(console.warn);

      setTimeout(() => { socketService.joinFarm(user.id); }, 500);

      // ─── POLLING: Kiểm tra cảnh báo mới mỗi 15 giây ─────────────────────
      // Đây là cách đáng tin cậy nhất, không phụ thuộc socket hay push token
      let lastAlertId = 0; // Lưu ID cảnh báo cuối cùng đã xử lý

      const pollAlerts = async () => {
        try {
          const res = await alertApi.getAll(1);
          const alerts: any[] = res.data?.data ?? res.data ?? [];

          // Lấy cảnh báo mới nhất chưa đọc
          const unread = alerts.filter((a: any) => !a.isRead);
          setUnreadCount(unread.length);

          // Tìm cảnh báo mới nhất (ID lớn nhất) chưa được xử lý
          const newestAlert = alerts.length > 0 ? alerts[0] : null; // API trả về DESC
          if (newestAlert && newestAlert.id > lastAlertId && !newestAlert.isRead) {
            lastAlertId = newestAlert.id;

            const isCritical = ['fire', 'toxic_gas', 'high_temp', 'feed_error', 'feed_insufficient'].includes(newestAlert.alertType);
            if (isCritical) {
              // 1) Hiện hộp thoại trực tiếp (khi app đang mở)
              Alert.alert(
                newestAlert.alertType === 'fire' ? '🔥 CHAY KHAN CAP'
                : newestAlert.alertType === 'toxic_gas' ? '☠️ KHI DOC'
                : newestAlert.alertType === 'high_temp' ? '🌡️ NHIET DO CAO'
                : '⚠️ CANH BAO CHO AN',
                newestAlert.message || 'Co bat thuong tai chuong!'
              );

              // 2) Gửi local notification (hiện trên thanh thông báo)
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: newestAlert.alertType === 'fire' ? '🔥 CHAY KHAN CAP'
                       : newestAlert.alertType === 'toxic_gas' ? '☠️ KHI DOC'
                       : newestAlert.alertType === 'high_temp' ? '🌡️ NHIET DO CAO'
                       : '⚠️ CANH BAO CHO AN',
                  body: newestAlert.message || 'Co bat thuong tai chuong!',
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.MAX,
                },
                trigger: null,
              });
            }
          }
        } catch (_) {
          // Bỏ qua lỗi mạng để polling tiếp tục
        }
      };

      // Chạy lần đầu ngay lập tức rồi cứ 15 giây một lần
      pollAlerts();
      const intervalId = setInterval(pollAlerts, 15000);

      // Socket listener (bổ sung thêm, không phải chính)
      socketService.onNewAlert((newAlert: any) => {
        incrementUnread();
      });

      return () => {
        clearInterval(intervalId);
        socketService.offNewAlert(() => {});
      };
    } else {
      socketService.disconnect();
      return () => {};
    }
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

