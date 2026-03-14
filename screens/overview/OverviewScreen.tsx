import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { barnApi } from '../../services/api';
import { COLORS, SOCKET_URL } from '../../constants/config';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

// --- Interfaces ---
interface BarnSummary {
  id: number;
  name: string;
  chickenCount: number;
  temperature: number | null;
  humidity: number | null;
  status: 'active' | 'empty' | 'maintenance' | string;
}

interface FarmOverview {
  totalBarns: number;
  totalChickens: number;
  avgTemperature: number;
  avgHumidity: number;
  unreadAlerts: number;
  barns: BarnSummary[];
}

interface SensorUpdate {
  barnId: number;
  temperature: number;
  humidity: number;
  recordedAt: string;
}

export default function OverviewScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [overview, setOverview] = useState<FarmOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newBarnName, setNewBarnName] = useState('');
  const [newBarnLocation, setNewBarnLocation] = useState('');
  const [newBarnCapacity, setNewBarnCapacity] = useState('');

  const fetchOverview = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const res = await barnApi.getOverview();
      const data = res.data?.data || res.data;
      if (data) {
         setOverview(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải overview:', err);
      setError('Không thể tải dữ liệu trang trại lúc này.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOverview(true);
  }, [fetchOverview]);

  // Handle Socket.IO binding for real-time sensor updates
  useEffect(() => {
    fetchOverview();

    let socket: Socket | null = null;
    if (token) {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket?.emit('join:farm', { userId: user?.id ?? 1 });
      });

      socket.on('farm:overview:update', (data: SensorUpdate) => {
        setOverview((prev) => {
          if (!prev) return prev;

          // Update matching barn
          const updatedBarns = prev.barns.map((barn) =>
            barn.id === data.barnId
              ? { ...barn, temperature: data.temperature, humidity: data.humidity }
              : barn
          );

          // Recalculate global averages safely
          const validTemps = updatedBarns.map((b) => Number(b.temperature)).filter((t) => !isNaN(t) && t !== 0);
          const validHums = updatedBarns.map((b) => Number(b.humidity)).filter((h) => !isNaN(h) && h !== 0);

          return {
            ...prev,
            barns: updatedBarns,
            avgTemperature:
              validTemps.length > 0
                ? Math.round((validTemps.reduce((a, b) => a + b, 0) / validTemps.length) * 10) / 10
                : prev.avgTemperature,
            avgHumidity:
              validHums.length > 0
                ? Math.round((validHums.reduce((a, b) => a + b, 0) / validHums.length) * 10) / 10
                : prev.avgHumidity,
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
  }, [fetchOverview, token, user?.id]);

  const handleCreateBarn = async () => {
    if (!newBarnName || !newBarnLocation || !newBarnCapacity) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin chuồng.');
      return;
    }

    const capacityNum = parseInt(newBarnCapacity, 10);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      Alert.alert('Lỗi', 'Sức chứa phải là một số lớn hơn 0.');
      return;
    }

    try {
      await barnApi.create({
        name: newBarnName,
        location: newBarnLocation,
        capacity: capacityNum,
      });
      // Close modal and fresh re-pull data
      setModalVisible(false);
      setNewBarnName('');
      setNewBarnLocation('');
      setNewBarnCapacity('');
      fetchOverview();
    } catch (err) {
      console.error('Failed to create new barn', err);
      Alert.alert('Lỗi', 'Không thể tạo mới chuồng lúc này.');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return styles.badgeActive;
      case 'maintenance':
        return styles.badgeMaintenance;
      case 'empty':
      default:
        return styles.badgeEmpty;
    }
  };

  const renderBarnCard = ({ item }: { item: BarnSummary }) => (
    <TouchableOpacity 
      style={styles.barnCard} 
      activeOpacity={0.8}
      onPress={() => Alert.alert('Thông báo', 'Chi tiết chuồng (sắp ra mắt)')}
    >
       <View style={styles.barnHeaderRow}>
         <View style={styles.barnTitleWrap}>
           <Text style={styles.barnEmoji}>🏠</Text>
           <Text style={styles.barnName}>{item.name}</Text>
         </View>
         <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
           <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
         </View>
       </View>
       <View style={styles.barnDetailsRow}>
         <Text style={styles.barnDetailText}>
           🌡️ {item.temperature !== null ? `${item.temperature}°C` : '--'}
         </Text>
         <Text style={styles.barnDetailText}>
           💧 {item.humidity !== null ? `${item.humidity}%` : '--'}
         </Text>
       </View>
       <View style={styles.barnDetailsRow}>
         <Text style={styles.barnDetailText}>
           🐔 {Number(item.chickenCount).toLocaleString()} con
         </Text>
       </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
         <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu tổng quan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !overview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="warning-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOverview()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Header */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.navTitleWrap}>
          <Text style={styles.navTitle}>Tổng quan trang trại</Text>
          <Text style={styles.navSubtitle}>{user?.fullName || 'Người dùng'}</Text>
        </View>
        <TouchableOpacity onPress={() => fetchOverview()}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* 4 Generic Statistic Cards Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{overview?.totalBarns || 0}</Text>
             <Text style={styles.statLabel}>Tổng chuồng</Text>
          </View>
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{Number(overview?.totalChickens || 0).toLocaleString()}</Text>
             <Text style={styles.statLabel}>Tổng gà</Text>
          </View>
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{overview?.avgTemperature !== undefined ? `${overview.avgTemperature}°C` : '--'}</Text>
             <Text style={styles.statLabel}>Nhiệt độ TB</Text>
          </View>
          <View style={styles.statBox}>
             <Text style={[styles.statValue, (overview?.unreadAlerts || 0) > 0 && { color: COLORS.danger }]}>
               {overview?.unreadAlerts || 0}
             </Text>
             <Text style={styles.statLabel}>Cảnh báo</Text>
          </View>
        </View>

        {/* Barns List */}
        <View style={styles.listHeaderRow}>
           <Text style={styles.sectionTitle}>Danh sách chuồng</Text>
           <TouchableOpacity 
             style={styles.addBtn}
             onPress={() => setModalVisible(true)}
             activeOpacity={0.8}
           >
             <Text style={styles.addBtnText}>+ Thêm chuồng</Text>
           </TouchableOpacity>
        </View>

        {overview?.barns && overview.barns.length > 0 ? (
          <FlatList 
            data={overview.barns}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBarnCard}
            scrollEnabled={false} // since it's inside a ScrollView
            contentContainerStyle={styles.flatListContent}
          />
        ) : (
          <Text style={styles.emptyListText}>Chưa có chuồng nào được tạo.</Text>
        )}
      </ScrollView>

      {/* Create Barn Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm chuồng mới</Text>

            <Text style={styles.inputLabel}>Tên chuồng</Text>
            <TextInput
              style={styles.textInput}
              value={newBarnName}
              onChangeText={setNewBarnName}
              placeholder="VD: Chuồng 01"
            />

            <Text style={styles.inputLabel}>Địa điểm</Text>
            <TextInput
              style={styles.textInput}
              value={newBarnLocation}
              onChangeText={setNewBarnLocation}
              placeholder="VD: Khu A"
            />

            <Text style={styles.inputLabel}>Sức chứa (con)</Text>
            <TextInput
              style={styles.textInput}
              value={newBarnCapacity}
              onChangeText={setNewBarnCapacity}
              keyboardType="numeric"
              placeholder="VD: 1000"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleCreateBarn}
              >
                <Text style={styles.modalBtnSaveText}>Tạo Mới</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navTitleWrap: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  navSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  flatListContent: {
    gap: 12,
  },
  barnCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  barnHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  barnTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barnEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  barnName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  badgeActive: {
    backgroundColor: COLORS.secondary, // Green
  },
  badgeMaintenance: {
    backgroundColor: '#FF9800', // Orange
  },
  badgeEmpty: {
    backgroundColor: '#9E9E9E', // Gray
  },
  barnDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 16,
  },
  barnDetailText: {
    fontSize: 14,
    color: '#444',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Modal Overrides
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  modalBtnCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalBtnSaveText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
