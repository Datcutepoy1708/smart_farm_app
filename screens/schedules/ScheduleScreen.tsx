import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/config';

const ScheduleScreen = () => {
  const [selectedTab, setSelectedTab] = useState('active');

  const mockSchedules = [
    {
      id: 1,
      name: 'Cho ăn buổi sáng',
      type: 'feeding',
      barnId: 1,
      barnName: 'Chuồng 01',
      time: '06:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      isActive: true,
      nextRun: 'Hôm nay, 06:00',
      settings: { feedAmount: 50, unit: 'kg' },
    },
    {
      id: 2,
      name: 'Cho ăn buổi trưa',
      type: 'feeding',
      barnId: 1,
      barnName: 'Chuồng 01',
      time: '12:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      isActive: true,
      nextRun: 'Hôm nay, 12:00',
      settings: { feedAmount: 40, unit: 'kg' },
    },
    {
      id: 3,
      name: 'Kiểm tra nhiệt độ',
      type: 'monitoring',
      barnId: 2,
      barnName: 'Chuồng 02',
      time: '08:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      isActive: true,
      nextRun: 'Hôm nay, 08:00',
      settings: { threshold: 35, unit: '°C' },
    },
    {
      id: 4,
      name: 'Tưới nước',
      type: 'watering',
      barnId: 3,
      barnName: 'Chuồng 03',
      time: '14:00',
      days: ['mon', 'wed', 'fri', 'sun'],
      isActive: false,
      nextRun: 'Đã tắt',
      settings: { duration: 15, unit: 'phút' },
    },
    {
      id: 5,
      name: 'Vệ sinh chuồng',
      type: 'cleaning',
      barnId: 3,
      barnName: 'Chuồng 03',
      time: '16:00',
      days: ['sat'],
      isActive: true,
      nextRun: 'Thứ 7, 16:00',
      settings: { type: 'full_clean' },
    },
  ];

  const getScheduleIcon = (type: string) => {
    switch (type) {
      case 'feeding':
        return 'restaurant';
      case 'monitoring':
        return 'thermostat';
      case 'watering':
        return 'water-drop';
      case 'cleaning':
        return 'cleaning-services';
      default:
        return 'schedule';
    }
  };

  const getScheduleColor = (type: string) => {
    switch (type) {
      case 'feeding':
        return COLORS.secondary;
      case 'monitoring':
        return COLORS.warning;
      case 'watering':
        return COLORS.primary;
      case 'cleaning':
        return COLORS.gray;
      default:
        return COLORS.text;
    }
  };

  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      mon: 'T2',
      tue: 'T3',
      wed: 'T4',
      thu: 'T5',
      fri: 'T6',
      sat: 'T7',
      sun: 'CN',
    };
    return days[day] || day;
  };

  const toggleSchedule = (id: number) => {
    RNAlert.alert(
      'Xác nhận',
      'Bạn có muốn thay đổi trạng thái lịch trình này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => console.log('Toggle schedule', id) },
      ]
    );
  };

  const filteredSchedules = mockSchedules.filter(schedule => 
    selectedTab === 'active' ? schedule.isActive : !schedule.isActive
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch trình</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Tab Selection */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
            Đang hoạt động ({mockSchedules.filter(s => s.isActive).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'inactive' && styles.activeTab]}
          onPress={() => setSelectedTab('inactive')}
        >
          <Text style={[styles.tabText, selectedTab === 'inactive' && styles.activeTabText]}>
            Đã tắt ({mockSchedules.filter(s => !s.isActive).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredSchedules.map((schedule) => (
          <View key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleInfo}>
                <View style={[styles.scheduleIcon, { backgroundColor: getScheduleColor(schedule.type) }]}>
                  <Icon name={getScheduleIcon(schedule.type)} size={20} color={COLORS.white} />
                </View>
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleName}>{schedule.name}</Text>
                  <Text style={styles.scheduleLocation}>{schedule.barnName}</Text>
                </View>
              </View>
              <Switch
                value={schedule.isActive}
                onValueChange={() => toggleSchedule(schedule.id)}
                trackColor={{ false: COLORS.gray, true: getScheduleColor(schedule.type) }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.scheduleTime}>
              <Icon name="schedule" size={16} color={COLORS.primary} />
              <Text style={styles.timeText}>{schedule.time}</Text>
              <Text style={styles.nextRunText}>{schedule.nextRun}</Text>
            </View>

            <View style={styles.daysContainer}>
              <Text style={styles.daysLabel}>Lặp lại:</Text>
              <View style={styles.daysRow}>
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <View
                    key={day}
                    style={[
                      styles.dayChip,
                      schedule.days.includes(day) && styles.dayChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        schedule.days.includes(day) && styles.dayTextActive,
                      ]}
                    >
                      {getDayName(day)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {schedule.settings && (
              <View style={styles.settingsContainer}>
                <Text style={styles.settingsLabel}>Cài đặt:</Text>
                <View style={styles.settingsRow}>
                  {Object.entries(schedule.settings).map(([key, value]) => (
                    <View key={key} style={styles.settingItem}>
                      <Text style={styles.settingKey}>{key}:</Text>
                      <Text style={styles.settingValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.scheduleActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="edit" size={18} color={COLORS.primary} />
                <Text style={styles.actionText}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="play-arrow" size={18} color={COLORS.secondary} />
                <Text style={styles.actionText}>Chạy ngay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="delete" size={18} color={COLORS.danger} />
                <Text style={styles.actionText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  scheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  scheduleLocation: {
    fontSize: 14,
    color: COLORS.gray,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
    marginRight: 12,
  },
  nextRunText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  daysContainer: {
    marginBottom: 12,
  },
  daysLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '500',
  },
  dayTextActive: {
    color: COLORS.white,
  },
  settingsContainer: {
    marginBottom: 12,
  },
  settingsLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  settingItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 4,
  },
  settingKey: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 4,
  },
  settingValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ScheduleScreen;
