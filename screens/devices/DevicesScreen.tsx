import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import io, { Socket } from 'socket.io-client';

import { COLORS, SOCKET_URL } from '../../constants/config';
import { deviceApi } from '../../services/api';

interface BarnDevice {
  id: number;
  barnId: number;
  name: string;
  deviceType: 'feeder' | 'water' | 'fan' | 'heater' | 'washer';
  mqttTopic: string;
  currentStatus: 'ON' | 'OFF';
  isActive: boolean;
}

const DevicesScreen = () => {
  const navigation = useNavigation();
  const [devices, setDevices] = useState<BarnDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ON' | 'OFF'>('ALL');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Assuming user ID is 1 for the websocket room as specified in backend
  const userId = 1;
  const BARN_ID = 1;

  const fetchDevices = async () => {
    try {
      setError(null);
      const response = await deviceApi.getBarnDevices(BARN_ID);
      if (response.data.success) {
        setDevices(response.data.data);
      } else {
        setError('Không thể tải danh sách thiết bị');
      }
    } catch (err: any) {
      console.error('Fetch devices error:', err);
      setError('Đã xảy ra lỗi khi tải thiết bị');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Setup Socket.IO
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join:farm', { userId });
    });

    newSocket.on('device:status', (data: any) => {
      // Update local state without full reload
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.id === data.device_id
            ? { ...device, currentStatus: data.status }
            : device
        )
      );
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  const activeCount = devices.filter((d) => d.currentStatus === 'ON').length;

  const filteredDevices = devices.filter((device) => {
    if (filter === 'ALL') return true;
    return device.currentStatus === filter;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'feeder': return 'restaurant';
      case 'water': return 'water';
      case 'fan': return 'aperture';
      case 'heater': return 'sunny';
      case 'washer': return 'sparkles';
      default: return 'hardware-chip';
    }
  };

  const toggleDevice = async (device: BarnDevice) => {
    const previousStatus = device.currentStatus;
    const newStatus = previousStatus === 'ON' ? 'OFF' : 'ON';

    // Optimistic Update
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, currentStatus: newStatus } : d))
    );

    try {
      const response = await deviceApi.control({
        deviceId: device.id,
        action: newStatus,
      });

      if (!response.data.success) {
        throw new Error('API reported failure');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      // Revert on failure
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, currentStatus: previousStatus } : d))
      );
      Alert.alert('Lỗi', 'Không thể điều khiển thiết bị, vui lòng thử lại.');
    }
  };

  const renderDeviceCard = ({ item }: { item: BarnDevice }) => {
    const isON = item.currentStatus === 'ON';

    return (
      <View style={[styles.card, isON && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, isON ? styles.iconActive : styles.iconInactive]}>
            <Icon
              name={getDeviceIcon(item.deviceType)}
              size={28}
              color={isON ? COLORS.primary : COLORS.gray}
            />
          </View>
          <Switch
            value={isON}
            onValueChange={() => toggleDevice(item)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.secondary }}
            thumbColor={COLORS.white}
          />
        </View>
        <Text style={[styles.deviceName, isON && styles.textActive]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.deviceType}>{item.deviceType.toUpperCase()}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDevices}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Thiết bị</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount} đang bật</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ON', label: 'Đang bật' },
            { id: 'OFF', label: 'Đã tắt' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                filter === tab.id && styles.filterTabActive,
              ]}
              onPress={() => setFilter(tab.id as 'ALL' | 'ON' | 'OFF')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === tab.id && styles.filterTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDeviceCard}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có thiết bị nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 12,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  gridContainer: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: '#C8E6C9',
  },
  iconInactive: {
    backgroundColor: COLORS.lightGray,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  textActive: {
    color: COLORS.primary,
  },
  deviceType: {
    fontSize: 12,
    color: COLORS.gray,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
  },
});

export default DevicesScreen;
