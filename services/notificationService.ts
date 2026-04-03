import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from './api';

/**
 * Xin quyền notification, lấy Expo Push Token và gửi lên backend.
 * CHỈ chạy trên thiết bị thật (không phải Expo Go simulator).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Chỉ chạy trên thiết bị vật lý
  if (!Device.isDevice) {
    console.log('Push Notifications chỉ hoạt động trên thiết bị thật.');
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
    console.log('Không được cấp quyền push notification.');
    return null;
  }

  // Lấy Expo Push Token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Gửi token lên backend
  try {
    await api.post('/notifications/register-token', {
      token,
      deviceName: Device.deviceName ?? 'Unknown Device',
    });
    console.log('✅ Đã đăng ký push token:', token);
  } catch (err) {
    console.warn('Không thể đăng ký push token:', err);
  }

  return token;
}
