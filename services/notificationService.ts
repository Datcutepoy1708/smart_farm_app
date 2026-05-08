import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

/**
 * Xin quyền notification, lấy Expo Push Token và gửi lên backend.
 * CHỈ chạy trên thiết bị thật (không phải Expo Go simulator).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Chỉ chạy trên thiết bị vật lý
  if (!Device.isDevice) {
    console.log('Push Notifications chi hoat dong tren thiet bi that.');
    return null;
  }

  // Xin quyền
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Khong duoc cap quyen push notification.');
    return null;
  }

  // Set channel cho Android để hiện Pop-up (heads-up notification) giống Messenger
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Kênh riêng cho cảnh báo khẩn cấp (cháy, khí độc)
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Canh Bao Khan Cap',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FF0000',
      sound: 'default',
      enableVibrate: true,
    });
  }

  // Lấy Expo Push Token - BẮT BUỘC phải có projectId từ SDK 49+
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[Push] Khong tim thay projectId trong app.json!');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;
  console.log('[Push] Token:', token);

  // Gửi token lên backend
  try {
    await api.post('/notifications/register-token', {
      token,
      deviceName: Device.deviceName ?? 'Unknown Device',
    });
    console.log('[Push] Da dang ky push token thanh cong');
  } catch (err) {
    console.warn('[Push] Khong the dang ky push token:', err);
  }

  return token;
}
