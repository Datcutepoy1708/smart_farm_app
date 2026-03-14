import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
  ActivityIndicator,
  AlertButton,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';
import { alertApi } from '../../services/api';
import socketService from '../../services/socket';

const timeAgo = (dateInput: string | Date) => {
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};


interface AlertData {
  id: number;
  barnId: number;
  alertType: string;
  severity: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  detailData?: any;
}

const AlertScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hardcode barnId = 1 temporarily as described in requirements
  const barnId = 1;

  useEffect(() => {
    fetchAlerts();

    // Listen for new alerts via socket
    socketService.onNewAlert((newAlert: any) => {
      if (newAlert.barnId === barnId || newAlert.barn_id === barnId) {
        setAlerts((prev) => [
          {
            id: newAlert.id,
            barnId: newAlert.barnId || newAlert.barn_id,
            alertType: newAlert.alertType || newAlert.type,
            severity: newAlert.severity,
            message: newAlert.message,
            isRead: false,
            createdAt: newAlert.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      // Need to cast to any since we changed the payload interface
      socketService.offNewAlert(() => {}); 
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [alertsRes, unreadRes] = await Promise.all([
        alertApi.getAll(barnId),
        alertApi.getUnreadCount(barnId),
      ]);
      setAlerts(alertsRes.data);
      setUnreadCount(unreadRes.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (severity: string, type: string) => {
    if (type === 'high_temp') return { name: 'thermostat', color: COLORS.danger };
    if (type === 'low_temp') return { name: 'ac-unit', color: COLORS.warning };
    if (type === 'high_humidity') return { name: 'water-drop', color: COLORS.warning };

    switch (severity) {
      case 'critical':
        return { name: 'warning', color: COLORS.danger };
      case 'warning':
        return { name: 'error', color: COLORS.warning };
      case 'info':
        return { name: 'info', color: COLORS.primary };
      default:
        return { name: 'info', color: COLORS.primary };
    }
  };

  const handleAlertPress = (alert: AlertData) => {
    const buttons: AlertButton[] = [];
    if (!alert.isRead) {
      buttons.push({ text: 'Đánh dấu đã đọc', onPress: () => markAsRead(alert.id) });
    }
    buttons.push({ text: 'Đóng', style: 'cancel' });

    RNAlert.alert(
      'Chi tiết cảnh báo',
      alert.message,
      buttons
    );
  };

  const markAsRead = async (id: number) => {
    try {
      await alertApi.markRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertApi.markAllRead(barnId);
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const filteredAlerts = alerts.filter(
    (alert) => selectedFilter === 'all' || alert.severity === selectedFilter
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cảnh báo</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={handleMarkAllRead}>
          <Icon name="done-all" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'critical', label: 'Nghiêm trọng' },
          { id: 'warning', label: 'Cảnh báo' },
          { id: 'info', label: 'Thông tin' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              selectedFilter === filter.id && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : filteredAlerts.length === 0 ? (
          <Text style={styles.emptyText}>Không có cảnh báo nào</Text>
        ) : (
          filteredAlerts.map((alert) => {
            const icon = getAlertIcon(alert.severity, alert.alertType);
            return (
              <TouchableOpacity
                key={alert.id.toString()}
                style={[
                  styles.alertItem,
                  !alert.isRead && styles.unreadAlert,
                ]}
                onPress={() => handleAlertPress(alert)}
              >
                <View style={styles.alertIcon}>
                  <Icon name={icon.name} size={24} color={icon.color} />
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Text style={[styles.alertTitle, { color: icon.color }]}>
                      {alert.severity === 'critical' ? 'Lỗi Nghiêm Trọng' : 
                       alert.severity === 'warning' ? 'Cảnh Báo' : 'Thông Tin'}
                    </Text>
                    <Text style={styles.alertTime}>
                      {timeAgo(alert.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.alertMessage} numberOfLines={2}>
                    {alert.message}
                  </Text>
                  <View style={styles.alertMeta}>
                    <Text style={styles.barnText}>Chuồng {alert.barnId}</Text>
                    {!alert.isRead && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>Mới</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerBadge: {
    backgroundColor: 'red',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: COLORS.background,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  alertMessage: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 20,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    marginTop: 20,
  },
});

export default AlertScreen;
