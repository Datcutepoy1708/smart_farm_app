import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FontAwesome5 } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../store/authStore';
import { COLORS, API_URL, SOCKET_URL } from '../../constants/config';

// ==================== INTERFACES ====================

interface BarnSummary {
  id: number;
  name: string;
  chickenCount: number;
  temperature: number | null;
  humidity: number | null;
  status: string;
}

interface Activity {
  id: number;
  type: 'alert' | 'feeding' | 'device' | 'note';
  title: string;
  description: string;
  barnName: string;
  createdAt: string;
}

interface FarmOverview {
  totalBarns: number;
  totalChickens: number;
  avgTemperature: number;
  avgHumidity: number;
  unreadAlerts: number;
  barns: BarnSummary[];
  recentActivities: Activity[];
}

interface SensorUpdate {
  barnId: number;
  temperature: number;
  humidity: number;
  recordedAt: string;
}

// ==================== COMPONENT ====================

const DashboardScreen = () => {
  const { user, token, logout } = useAuth();
  const [overview, setOverview] = useState<FarmOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch farm overview từ API
  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/barns/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: { success: boolean; data: FarmOverview } = await response.json();

      if (result.success) {
        setOverview(result.data);
      } else {
        throw new Error('API trả về lỗi');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(msg);
      console.error('Fetch overview error:', msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Kết nối Socket.IO + fetch data lần đầu
  useEffect(() => {
    fetchOverview();

    // Kết nối Socket.IO
    let socket: Socket | null = null;

    if (token) {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        socket?.emit('join:farm', { userId: user?.id ?? 1 });
      });

      // Lắng nghe real-time update từ MQTT → Gateway
      socket.on('farm:overview:update', (data: SensorUpdate) => {
        setOverview((prev) => {
          if (!prev) return prev;

          // Cập nhật temperature/humidity của barn tương ứng
          const updatedBarns = prev.barns.map((barn) =>
            barn.id === data.barnId
              ? { ...barn, temperature: data.temperature, humidity: data.humidity }
              : barn,
          );

          // Tính lại avgTemperature và avgHumidity
          const temps = updatedBarns
            .map((b) => b.temperature)
            .filter((t): t is number => t !== null);
          const hums = updatedBarns
            .map((b) => b.humidity)
            .filter((h): h is number => h !== null);

          return {
            ...prev,
            barns: updatedBarns,
            avgTemperature:
              temps.length > 0
                ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
                : prev.avgTemperature,
            avgHumidity:
              hums.length > 0
                ? Math.round((hums.reduce((a, b) => a + b, 0) / hums.length) * 10) / 10
                : prev.avgHumidity,
          };
        });
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
      });
    }

    // Cleanup khi unmount
    return () => {
      if (socket) {
        socket.emit('leave:farm', { userId: user?.id ?? 1 });
        socket.disconnect();
      }
    };
  }, [token, fetchOverview, user?.id]);

  const handleLogout = () => {
    logout();
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOverview}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Chào mừng trở lại,</Text>
            <Text style={styles.userName}>{user?.fullName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome5 name="temperature-high" size={32} color="green" />
            <Text style={styles.statNumber}>
              {overview?.avgTemperature !== undefined
                ? `${overview.avgTemperature}°`
                : '--°'}
            </Text>
            <Text style={styles.statLabel}>Nhiệt độ</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pets" size={32} color={COLORS.secondary} />
            <Text style={styles.statNumber}>
              {overview?.totalChickens !== undefined
                ? overview.totalChickens.toLocaleString()
                : '--'}
            </Text>
            <Text style={styles.statLabel}>Gà thịt</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome5 name="tint" size={32} color={COLORS.secondary} />
            <Text style={styles.statNumber}>
              {overview?.avgHumidity !== undefined
                ? `${overview.avgHumidity}%`
                : '--%'}
            </Text>
            <Text style={styles.statLabel}>Độ ẩm</Text>
          </View>
          <View style={styles.statCard}>
            <Icon
              name="warning"
              size={32}
              color={
                (overview?.unreadAlerts ?? 0) > 0
                  ? COLORS.danger
                  : COLORS.secondary
              }
            />
            <Text
              style={[
                styles.statNumber,
                (overview?.unreadAlerts ?? 0) > 0 && styles.alertNumberDanger,
              ]}
            >
              {overview?.unreadAlerts ?? 0}
            </Text>
            <Text style={styles.statLabel}>Cảnh báo</Text>
          </View>
        </View>

        {/* Danh sách chuồng */}
        {overview?.barns && overview.barns.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Danh sách chuồng</Text>
            <View style={styles.barnsListContainer}>
              {overview.barns.map((barn) => (
                <View key={barn.id} style={styles.barnItem}>
                  <View style={styles.barnInfo}>
                    <Text style={styles.barnName}>{barn.name}</Text>
                    <Text style={styles.barnChicken}>
                      🐔 {barn.chickenCount.toLocaleString()} con
                    </Text>
                  </View>
                  <View style={styles.barnStats}>
                    <Text style={styles.barnTemp}>
                      🌡️ {barn.temperature !== null ? `${barn.temperature}°C` : '--'}
                    </Text>
                    <Text style={styles.barnHumidity}>
                      💧 {barn.humidity !== null ? `${barn.humidity}%` : '--'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      barn.status === 'active'
                        ? styles.statusActive
                        : styles.statusInactive,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {barn.status === 'active' ? 'Hoạt động' : barn.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="add" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Thêm chuồng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="camera-alt" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="assessment" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <View style={styles.activityContainer}>
            {overview?.recentActivities && overview.recentActivities.length > 0 ? (
              overview.recentActivities.map((activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    index === overview.recentActivities.length - 1 &&
                      styles.activityItemLast,
                  ]}
                >
                  <View style={styles.activityIcon}>
                    <Icon
                      name={
                        activity.type === 'alert'
                          ? 'warning'
                          : activity.type === 'feeding'
                            ? 'restaurant'
                            : activity.type === 'device'
                              ? 'settings'
                              : 'note'
                      }
                      size={16}
                      color={
                        activity.type === 'alert' ? COLORS.danger : COLORS.primary
                      }
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>
                      {activity.barnName} - {activity.description}
                    </Text>
                    <Text style={styles.activityTime}>{activity.createdAt}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 8,
  },
  alertNumberDanger: {
    color: COLORS.danger,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  // Barns list
  barnsListContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  barnInfo: {
    flex: 1,
  },
  barnName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  barnChicken: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  barnStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  barnTemp: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  barnHumidity: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Quick actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  // Activity
  activityContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityItemLast: {
    marginBottom: 0,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.gray,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 14,
    paddingVertical: 16,
  },
});

export default DashboardScreen;
