import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../store/authStore';
import { COLORS, SOCKET_URL } from '../../constants/config';
import { barnApi, alertApi, deviceApi } from '../../services/api';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

interface DashboardStats {
  totalBarns: number;
  totalChickens: number;
  totalDevices: number;
  unreadAlerts: number;
  avgTemperature: number | null;
  avgHumidity: number | null;
}

const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const token = useAuthStore((state) => state.token);
  const navigation = useNavigation();

  const [stats, setStats] = useState<DashboardStats>({
    totalBarns: 0,
    totalChickens: 0,
    totalDevices: 0,
    unreadAlerts: 0,
    avgTemperature: null,
    avgHumidity: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      // Gọi overview endpoint
      const overviewRes = await barnApi.getOverview();
      const overviewData = overviewRes.data?.data || overviewRes.data;

      // Gọi alerts để lấy số chưa đọc
      let unreadCount = 0;
      try {
        const alertsRes = await alertApi.getAll(1);
        const alerts: any[] = alertsRes.data?.data ?? alertsRes.data ?? [];
        unreadCount = alerts.filter((a: any) => !a.isRead).length;
      } catch (_) {}

      // Lấy tổng thiết bị từ chuồng 1 (hoặc tất cả nếu có API)
      let totalDevices = 0;
      try {
        if (overviewData?.barns && overviewData.barns.length > 0) {
          for (const barn of overviewData.barns.slice(0, 4)) {
            const devRes = await deviceApi.getBarnDevices(barn.id);
            const devList = devRes.data?.data ?? devRes.data ?? [];
            totalDevices += Array.isArray(devList) ? devList.length : 0;
          }
        }
      } catch (_) {}

      if (overviewData) {
        setStats({
          totalBarns: overviewData.totalBarns || 0,
          totalChickens: overviewData.totalChickens || 0,
          totalDevices,
          unreadAlerts: unreadCount,
          avgTemperature: overviewData.avgTemperature ?? null,
          avgHumidity: overviewData.avgHumidity ?? null,
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats(true);
  }, [fetchStats]);

  // Real-time socket update
  useEffect(() => {
    fetchStats();

    let socket: Socket | null = null;
    if (token) {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket?.emit('join:farm', { userId: user?.id ?? 1 });
      });

      socket.on('farm:overview:update', (data: any) => {
        setStats((prev) => {
          // Cập nhật nhiệt độ TB nếu có update từ chuồng
          return {
            ...prev,
            avgTemperature: data.temperature ?? prev.avgTemperature,
          };
        });
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave:farm', { userId: user?.id ?? 1 });
        socket.disconnect();
      }
    };
  }, [fetchStats, token, user?.id]);

  const handleLogout = () => { logout(); };

  const goToSchedule = () => navigation.navigate('ScheduleNote' as never);
  const goToCamera = () => navigation.navigate('Camera' as never);
  const goToReport = () => navigation.navigate('Overview' as never);

  const getTempColor = (temp: number | null) => {
    if (temp === null) return COLORS.gray;
    if (temp > 35) return COLORS.danger;
    if (temp > 30) return COLORS.warning;
    return '#2196F3';
  };

  const getTempLabel = (temp: number | null) => {
    if (temp === null) return 'N/A';
    if (temp > 35) return 'Quá cao!';
    if (temp > 30) return 'Hơi nóng';
    return 'Bình thường';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
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

        {/* Nhiệt độ hiện tại - Banner nổi bật */}
        <View style={[styles.tempBanner, { borderLeftColor: getTempColor(stats.avgTemperature) }]}>
          <View style={styles.tempBannerLeft}>
            <Text style={styles.tempBannerLabel}>🌡️ Nhiệt độ TB trang trại</Text>
            <Text style={[styles.tempBannerValue, { color: getTempColor(stats.avgTemperature) }]}>
              {stats.avgTemperature !== null ? `${stats.avgTemperature}°C` : '--'}
            </Text>
            <Text style={[styles.tempBannerStatus, { color: getTempColor(stats.avgTemperature) }]}>
              {getTempLabel(stats.avgTemperature)}
            </Text>
          </View>
          <View style={styles.tempBannerRight}>
            <View style={[styles.tempIconWrap, { backgroundColor: getTempColor(stats.avgTemperature) + '22' }]}>
              <Ionicons name="thermometer" size={40} color={getTempColor(stats.avgTemperature)} />
            </View>
            {stats.avgHumidity !== null && (
              <Text style={styles.humidityText}>💧 {stats.avgHumidity}%</Text>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Overview' as never)}>
              <Icon name="home" size={32} color={COLORS.primary} />
              <Text style={styles.statNumber}>{stats.totalBarns}</Text>
              <Text style={styles.statLabel}>Chuồng trại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Overview' as never)}>
              <Icon name="pets" size={32} color={COLORS.secondary} />
              <Text style={styles.statNumber}>{Number(stats.totalChickens).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Gia cầm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Devices' as never)}>
              <Icon name="devices" size={32} color={COLORS.warning} />
              <Text style={styles.statNumber}>{stats.totalDevices}</Text>
              <Text style={styles.statLabel}>Thiết bị</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Alerts' as never)}>
              <Icon name="warning" size={32} color={COLORS.danger} />
              <Text style={[styles.statNumber, stats.unreadAlerts > 0 && { color: COLORS.danger }]}>
                {stats.unreadAlerts}
              </Text>
              <Text style={styles.statLabel}>Cảnh báo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={goToSchedule}>
              <Icon name="event-note" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Lịch GC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={goToCamera}>
              <Icon name="camera-alt" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={goToReport}>
              <Icon name="assessment" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Tổng quan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  // Nhiệt độ Banner
  tempBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tempBannerLeft: {
    flex: 1,
  },
  tempBannerLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6,
    fontWeight: '500',
  },
  tempBannerValue: {
    fontSize: 42,
    fontWeight: 'bold',
    lineHeight: 50,
  },
  tempBannerStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  tempBannerRight: {
    alignItems: 'center',
    gap: 8,
  },
  tempIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  humidityText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  // Stats
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray,
    fontSize: 14,
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
});

export default DashboardScreen;
