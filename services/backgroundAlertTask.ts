import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../constants/config';

export const ALERT_BACKGROUND_TASK = 'SMART_FARM_ALERT_CHECK';

// ─── Định nghĩa task chạy ngầm ────────────────────────────────────────────────
TaskManager.defineTask(ALERT_BACKGROUND_TASK, async () => {
  try {
    const token = useAuthStore.getState().token;
    if (!token) return BackgroundFetch.BackgroundFetchResult.NoData;

    const res = await fetch(`${API_URL}/barns/1/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return BackgroundFetch.BackgroundFetchResult.Failed;

    const json = await res.json();
    const alerts: any[] = json?.data ?? json ?? [];

    // Lấy cảnh báo mới nhất chưa đọc và là loại nguy hiểm
    const critical = alerts.find(
      (a: any) =>
        !a.isRead &&
        ['fire', 'toxic_gas', 'high_temp', 'feed_error', 'feed_insufficient'].includes(a.alertType)
    );

    if (critical) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title:
            critical.alertType === 'fire' ? '🔥 CHAY KHAN CAP'
            : critical.alertType === 'toxic_gas' ? '☠️ KHI DOC'
            : critical.alertType === 'high_temp' ? '🌡️ NHIET DO CAO'
            : '⚠️ CANH BAO CHO AN',
          body: critical.message || 'Co bat thuong tai chuong!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Đăng ký task với hệ thống ────────────────────────────────────────────────
export async function registerBackgroundAlertTask(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    console.log('[BG] Background fetch bi chan boi he dieu hanh');
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(ALERT_BACKGROUND_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(ALERT_BACKGROUND_TASK, {
      minimumInterval: 15 * 60, // 15 phút (giới hạn tối thiểu của hệ điều hành)
      stopOnTerminate: false,   // Tiếp tục chạy sau khi người dùng tắt app
      startOnBoot: true,        // Tự khởi động lại sau khi reboot điện thoại
    });
    console.log('[BG] Da dang ky background alert task');
  }
}
