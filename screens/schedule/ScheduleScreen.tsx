import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scheduleApi, deviceApi } from '../../services/api';

interface Schedule {
  id: number;
  barnId: number;
  deviceId: number;
  deviceName: string;
  deviceType: 'feeder' | 'water' | 'fan' | 'heater' | 'washer';
  name: string;
  scheduledTime: string; // "06:00"
  durationSeconds: number;
  daysOfWeek: number[]; // [1,2,3,4,5,6,7]
  feedAmountGram?: number;
  isActive: boolean;
}

// Map frontend types slightly if backend just returns device object
// Assumption: backend 'data' array contains objects with joined 'device' info
interface ApiSchedule {
  id: number;
  barnId: number;
  deviceId: number;
  name: string;
  scheduledTime: string;
  durationSeconds: number;
  daysOfWeek: number[];
  feedAmountGram: number | null;
  isActive: boolean;
  device: {
    id: number;
    name: string;
    deviceType: string;
  };
}

const COLORS = {
  primary: '#2D6A2D',
  secondary: '#4CAF50',
  textSecondary: '#757575',
  background: '#F5F5F5',
  white: '#FFFFFF',
  grayLight: '#E0E0E0',
  danger: '#F44336',
};

const WEEKDAYS = [
  { id: 1, label: 'M' },
  { id: 2, label: 'T' },
  { id: 3, label: 'W' },
  { id: 4, label: 'T' },
  { id: 5, label: 'F' },
  { id: 6, label: 'S' },
  { id: 7, label: 'S' },
];

const DEVICE_IMAGES: Record<string, string> = {
  feeder: 'https://picsum.photos/seed/feeder/400/200',
  water: 'https://picsum.photos/seed/water/400/200',
  fan: 'https://picsum.photos/seed/fan/400/200',
  heater: 'https://picsum.photos/seed/heater/400/200',
  washer: 'https://picsum.photos/seed/washer/400/200',
};

type FilterType = 'all' | 'active' | 'inactive';

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableDevices, setAvailableDevices] = useState<{ id: number; name: string; type: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);

  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState<number | null>(null);
  const [newTime, setNewTime] = useState('06:00');
  const [newDuration, setNewDuration] = useState('30');
  const [newFeedAmount, setNewFeedAmount] = useState('');
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  // Hardcoded barnId strictly internally as requested
  const barnId = 1;

  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, devRes] = await Promise.all([
        scheduleApi.getBarnSchedules(barnId),
        deviceApi.getBarnDevices(barnId),
      ]);

      const mappedSchedules: Schedule[] = schedRes.data.data.map((s: ApiSchedule) => ({
        id: s.id,
        barnId: s.barnId,
        deviceId: s.deviceId,
        deviceName: s.device?.name || 'Unknown Device',
        deviceType: (s.device?.deviceType || 'fan') as Schedule['deviceType'],
        name: s.name,
        scheduledTime: s.scheduledTime,
        durationSeconds: s.durationSeconds,
        daysOfWeek: s.daysOfWeek,
        feedAmountGram: s.feedAmountGram || undefined,
        isActive: s.isActive,
      }));

      setSchedules(mappedSchedules);
      
      const devices = devRes.data.data || devRes.data; // Check standard response structure
      setAvailableDevices(devices.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.deviceType
      })));

    } catch (error) {
      console.error('Failed to fetch schedules', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu lịch trình.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (id: number, currentStatus: boolean) => {
    // Optimistic update
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s))
    );

    try {
      await scheduleApi.update(id, { isActive: !currentStatus });
    } catch (error) {
      console.error('Failed to toggle schedule', error);
      // Revert if API fails
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: currentStatus } : s))
      );
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
    }
  };

  const deleteSchedule = (id: number) => {
    Alert.alert('Xóa lịch trình', 'Bạn có chắc chắn muốn xóa lịch trình này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await scheduleApi.remove(id);
            setSchedules((prev) => prev.filter((s) => s.id !== id));
          } catch (error) {
            console.error('Failed to delete schedule', error);
            Alert.alert('Lỗi', 'Không thể xóa lịch trình.');
          }
        },
      },
    ]);
  };

  const getFilteredSchedules = () => {
    if (filter === 'active') return schedules.filter((s) => s.isActive);
    if (filter === 'inactive') return schedules.filter((s) => !s.isActive);
    return schedules;
  };

  const formatAMPM = (timeStr: string) => {
    // Time str formats like "06:00"
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const toggleNewDay = (dayId: number) => {
    setNewDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleSaveSchedule = async () => {
    if (!newName || !newDeviceId || !newTime || !newDuration) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    // HH:MM Regex verification manually just to be safe
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      Alert.alert('Lỗi', 'Thời gian phải có định dạng HH:MM (VD: 06:00)');
      return;
    }

    if (newDays.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ngày trong tuần.');
      return;
    }

    const duration = parseInt(newDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Lỗi', 'Thời gian chạy phải là số lớn hơn 0.');
      return;
    }

    let feedAmountGram = undefined;
    const selectedDev = availableDevices.find(d => d.id === newDeviceId);
    
    if (selectedDev?.type === 'feeder') {
      const feedAmt = parseInt(newFeedAmount, 10);
      if (isNaN(feedAmt) || feedAmt <= 0) {
        Alert.alert('Lỗi', 'Lượng thức ăn (Feeder) phải là số dương hợp lệ.');
        return;
      }
      feedAmountGram = feedAmt;
    }

    const payload = {
      barnId,
      deviceId: newDeviceId,
      name: newName,
      scheduledTime: newTime,
      durationSeconds: duration,
      daysOfWeek: newDays,
      feedAmountGram,
    };

    try {
      if (editingScheduleId !== null) {
        // Edit existing schedule
        await scheduleApi.update(editingScheduleId, payload);
        
        // Optimistic UI update
        setSchedules((prev) => 
          prev.map((s) => s.id === editingScheduleId ? {
            ...s,
            deviceId: payload.deviceId,
            deviceName: selectedDev?.name || s.deviceName,
            deviceType: (selectedDev?.type || s.deviceType) as Schedule['deviceType'],
            name: payload.name,
            scheduledTime: payload.scheduledTime,
            durationSeconds: payload.durationSeconds,
            daysOfWeek: payload.daysOfWeek,
            feedAmountGram: payload.feedAmountGram || undefined,
          } : s)
        );
      } else {
        // Create new schedule
        const res = await scheduleApi.create(payload);
        const s = res.data.data;
        
        const newSchedule: Schedule = {
          id: s.id,
          barnId: s.barnId,
          deviceId: s.deviceId,
          deviceName: s.device?.name || selectedDev?.name || 'Unknown Device',
          deviceType: (s.device?.deviceType || selectedDev?.type || 'fan') as Schedule['deviceType'],
          name: s.name,
          scheduledTime: s.scheduledTime,
          durationSeconds: s.durationSeconds,
          daysOfWeek: s.daysOfWeek,
          feedAmountGram: s.feedAmountGram || undefined,
          isActive: s.isActive,
        };

        setSchedules((prev) => [newSchedule, ...prev]);
      }
      setModalVisible(false);
      resetNewScheduleForm();
    } catch (error) {
      console.error('Failed to save schedule', error);
      Alert.alert('Lỗi', 'Không thể lưu lịch trình. Gặp lỗi khi thao tác.');
    }
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    setNewName(schedule.name);
    setNewDeviceId(schedule.deviceId);
    setNewTime(schedule.scheduledTime);
    setNewDuration(schedule.durationSeconds.toString());
    setNewFeedAmount(schedule.feedAmountGram ? schedule.feedAmountGram.toString() : '');
    setNewDays(schedule.daysOfWeek);
    setModalVisible(true);
  };

  const resetNewScheduleForm = () => {
    setEditingScheduleId(null);
    setNewName('');
    setNewDeviceId(null);
    setNewTime('06:00');
    setNewDuration('30');
    setNewFeedAmount('');
    setNewDays([1, 2, 3, 4, 5, 6, 7]);
  };

  const renderScheduleCard = ({ item }: { item: Schedule }) => {
    const imageUrl = DEVICE_IMAGES[item.deviceType] || DEVICE_IMAGES['fan'];

    return (
      <TouchableOpacity 
        style={styles.cardContainer} 
        onPress={() => openEditModal(item)}
        onLongPress={() => deleteSchedule(item.id)}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.cardImage} 
          resizeMode="cover" 
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.deviceConfigTitle}>{item.deviceName}</Text>
            <Switch
              trackColor={{ false: COLORS.grayLight, true: COLORS.secondary }}
              thumbColor={COLORS.white}
              ios_backgroundColor={COLORS.grayLight}
              onValueChange={() => toggleSchedule(item.id, item.isActive)}
              value={item.isActive}
              style={styles.switch}
            />
          </View>

          <Text style={styles.scheduleName}>{item.name}</Text>

          <View style={styles.timeRow}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeIcon}>🕐</Text>
              <Text style={styles.timeText}>{formatAMPM(item.scheduledTime)}</Text>
            </View>
            <Text style={styles.durationText}>
              Chạy: {item.durationSeconds} giây
              {item.feedAmountGram ? ` (${item.feedAmountGram}g)` : ''}
            </Text>
          </View>

          <View style={styles.daysContainer}>
            {WEEKDAYS.map((day) => {
              const isActiveDay = item.daysOfWeek.includes(day.id);
              return (
                <View
                  key={day.id}
                  style={[
                    styles.dayCircle,
                    isActiveDay ? styles.dayCircleActive : styles.dayCircleInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isActiveDay ? styles.dayTextActive : styles.dayTextInactive,
                    ]}
                  >
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch tự động</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={fetchData}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Internal Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'active', 'inactive'] as FilterType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, filter === tab && styles.tabButtonActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.tabText,
                filter === tab ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              {tab === 'all' && 'Tất cả'}
              {tab === 'active' && 'Đang bật'}
              {tab === 'inactive' && 'Đã tắt'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredSchedules()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderScheduleCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.grayLight} />
              <Text style={styles.emptyText}>Chưa có lịch trình nào.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      {!loading && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => {
            resetNewScheduleForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingScheduleId ? 'Cập nhật lịch trình' : 'Thêm lịch mới'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.inputLabel}>Chọn thiết bị</Text>
              {availableDevices.length === 0 ? (
                <Text style={{color: COLORS.danger, marginBottom: 12}}>
                  Không tìm thấy thiết bị nào trong chuồng này.
                </Text>
              ) : (
                <View style={styles.devicePickerContainer}>
                  {availableDevices.map((dev) => (
                    <TouchableOpacity
                      key={dev.id}
                      style={[
                        styles.deviceOption,
                        newDeviceId === dev.id && styles.deviceOptionActive,
                      ]}
                      onPress={() => setNewDeviceId(dev.id)}
                    >
                      <Text
                        style={[
                          styles.deviceOptionText,
                          newDeviceId === dev.id && styles.deviceOptionTextActive,
                        ]}
                      >
                        {dev.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Tên lịch trình</Text>
              <TextInput
                style={styles.textInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="VD: Cho ăn buổi sáng"
              />

              <Text style={styles.inputLabel}>Giờ chạy (Định dạng HH:MM)</Text>
              <TextInput
                style={styles.textInput}
                value={newTime}
                onChangeText={setNewTime}
                placeholder="06:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />

              <Text style={styles.inputLabel}>Ngày trong tuần</Text>
              <View style={styles.daysSelectionContainer}>
                {WEEKDAYS.map((day) => {
                  const isActiveDay = newDays.includes(day.id);
                  return (
                    <TouchableOpacity
                      key={day.id}
                      onPress={() => toggleNewDay(day.id)}
                      style={[
                        styles.dayCircleLarge,
                        isActiveDay ? styles.dayCircleActive : styles.dayCircleInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayTextLarge,
                          isActiveDay ? styles.dayTextActive : styles.dayTextInactive,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Thời gian duy trì (giây)</Text>
              <TextInput
                style={styles.textInput}
                value={newDuration}
                onChangeText={setNewDuration}
                keyboardType="numeric"
                placeholder="Ví dụ: 30"
              />

              {availableDevices.find(d => d.id === newDeviceId)?.type === 'feeder' && (
                <>
                  <Text style={styles.inputLabel}>Trọng lượng Feed (gram)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newFeedAmount}
                    onChangeText={setNewFeedAmount}
                    keyboardType="numeric"
                    placeholder="Khoảng bao nhiêu gram?"
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  onPress={handleSaveSchedule}
                >
                  <Text style={styles.modalBtnSaveText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: { marginTop: 40 },
      android: { marginTop: 20 },
    })
  },
  headerIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabTextInactive: {
    color: COLORS.textSecondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: 120,
    opacity: 0.9,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceConfigTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  scheduleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  durationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: COLORS.primary,
  },
  dayCircleInactive: {
    backgroundColor: COLORS.grayLight,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextActive: {
    color: COLORS.white,
  },
  dayTextInactive: {
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
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
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  devicePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  deviceOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    backgroundColor: COLORS.white,
  },
  deviceOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deviceOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deviceOptionTextActive: {
    color: COLORS.white,
  },
  daysSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  dayCircleLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTextLarge: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.grayLight,
  },
  modalBtnCancelText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnSaveText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
