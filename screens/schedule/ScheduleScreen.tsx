import React, { useState } from 'react';
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
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Schedule {
  id: number;
  barnId: number;
  deviceId: number;
  deviceType: 'feeder' | 'water' | 'fan' | 'heater' | 'washer';
  deviceName: string;
  name: string;
  scheduledTime: string; // "06:00"
  durationSeconds: number;
  daysOfWeek: number[]; // [1,2,3,4,5,6,7] — 1=T2, 7=CN
  feedAmountGram?: number;
  isActive: boolean;
}

const mockSchedules: Schedule[] = [
  {
    id: 1,
    barnId: 1,
    deviceId: 1,
    deviceType: 'feeder',
    deviceName: 'FEEDING SYSTEM',
    name: 'Cho ăn buổi sáng',
    scheduledTime: '06:00',
    durationSeconds: 30,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    feedAmountGram: 500,
    isActive: true,
  },
  {
    id: 2,
    barnId: 1,
    deviceId: 2,
    deviceType: 'water',
    deviceName: 'WATERING SYSTEM',
    name: 'Đổ nước chiều',
    scheduledTime: '17:00',
    durationSeconds: 60,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    isActive: true,
  },
  {
    id: 3,
    barnId: 1,
    deviceId: 3,
    deviceType: 'fan',
    deviceName: 'VENTILATION SYSTEM',
    name: 'Quạt buổi trưa',
    scheduledTime: '12:00',
    durationSeconds: 1800,
    daysOfWeek: [1, 2, 3, 4, 5],
    isActive: false,
  },
];

const COLORS = {
  primary: '#2D6A2D',
  secondary: '#4CAF50',
  textSecondary: '#757575',
  background: '#F5F5F5',
  white: '#FFFFFF',
  grayLight: '#E0E0E0',
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

type FilterType = 'all' | 'active' | 'inactive';

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [filter, setFilter] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);

  // New Schedule State
  const [newName, setNewName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<Schedule['deviceType']>('feeder');
  const [newTime, setNewTime] = useState('06:00');
  const [newDuration, setNewDuration] = useState('60');
  const [newFeedAmount, setNewFeedAmount] = useState('100');
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  // API placeholders:
  // GET  /api/barns/:barnId/schedules
  // POST /api/barns/:barnId/schedules
  // PATCH /api/schedules/:id
  // DELETE /api/schedules/:id

  const toggleSchedule = (id: number) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const getFilteredSchedules = () => {
    if (filter === 'active') return schedules.filter((s) => s.isActive);
    if (filter === 'inactive') return schedules.filter((s) => !s.isActive);
    return schedules;
  };

  const formatAMPM = (timeStr: string) => {
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

  const navigation = useNavigation();

  const handleSaveSchedule = () => {
    const newSchedule: Schedule = {
      id: Date.now(),
      barnId: 1, // hardcoded for now
      deviceId: Date.now(),
      deviceType: newDeviceType,
      deviceName: newDeviceType.toUpperCase() + ' SYSTEM',
      name: newName,
      scheduledTime: newTime,
      durationSeconds: parseInt(newDuration, 10) || 60,
      feedAmountGram: newDeviceType === 'feeder' ? parseInt(newFeedAmount, 10) : undefined,
      daysOfWeek: newDays,
      isActive: true,
    };
    setSchedules([...schedules, newSchedule]);
    setModalVisible(false);
    resetNewScheduleForm();
  };

  const resetNewScheduleForm = () => {
    setNewName('');
    setNewDeviceType('feeder');
    setNewTime('06:00');
    setNewDuration('60');
    setNewFeedAmount('100');
    setNewDays([1, 2, 3, 4, 5, 6, 7]);
  };

  const renderScheduleCard = ({ item }: { item: Schedule }) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.deviceConfigTitle}>{item.deviceName}</Text>
          <Switch
            trackColor={{ false: COLORS.grayLight, true: COLORS.secondary }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.grayLight}
            onValueChange={() => toggleSchedule(item.id)}
            value={item.isActive}
            style={styles.switch}
          />
        </View>

        <Text style={styles.scheduleName}>{item.name}</Text>

        <View style={styles.timeContainer}>
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={styles.timeText}>{formatAMPM(item.scheduledTime)}</Text>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch tự động</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
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

      {/* Schedule List */}
      <FlatList
        data={getFilteredSchedules()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderScheduleCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Schedule Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm lịch mới</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tên lịch trình</Text>
              <TextInput
                style={styles.textInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="VD: Cho ăn buổi sáng"
              />

              <Text style={styles.inputLabel}>Loại thiết bị</Text>
              <View style={styles.devicePickerContainer}>
                {(['feeder', 'water', 'fan', 'heater', 'washer'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.deviceOption,
                      newDeviceType === type && styles.deviceOptionActive,
                    ]}
                    onPress={() => setNewDeviceType(type)}
                  >
                    <Text
                      style={[
                        styles.deviceOptionText,
                        newDeviceType === type && styles.deviceOptionTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Giờ chạy (HH:MM)</Text>
              <TextInput
                style={styles.textInput}
                value={newTime}
                onChangeText={setNewTime}
                placeholder="06:00"
                keyboardType="numbers-and-punctuation"
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

              <Text style={styles.inputLabel}>Thời gian chạy (giây)</Text>
              <TextInput
                style={styles.textInput}
                value={newDuration}
                onChangeText={setNewDuration}
                keyboardType="numeric"
              />

              {newDeviceType === 'feeder' && (
                <>
                  <Text style={styles.inputLabel}>Lượng thức ăn (gram)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newFeedAmount}
                    onChangeText={setNewFeedAmount}
                    keyboardType="numeric"
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
    paddingVertical: 30,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
