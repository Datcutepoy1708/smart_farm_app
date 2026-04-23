import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, API_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeedingSchedule {
  id: number;
  barnId: number;
  barnName: string;
  time: string;
  feedType: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'completed' | 'skipped';
  notes?: string;
}

const FeedingScreen = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<'schedule' | 'history' | 'settings'>('schedule');

  // ── Cân HX711 calibration ─────────────────────────────────────────────────
  const [scaleFactor, setScaleFactor] = useState('2280');
  const [knownWeight, setKnownWeight] = useState('');
  const [isSendingScale, setIsSendingScale] = useState(false);

  const sendScaleFactor = async () => {
    const factor = parseFloat(scaleFactor);
    if (isNaN(factor) || factor <= 0) {
      RNAlert.alert('Lỗi', 'Hệ số cân phải là số dương hợp lệ');
      return;
    }
    setIsSendingScale(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/barns/1/scale-calibration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ factor }),
      });
      const json = await res.json();
      if (json.success) {
        RNAlert.alert('✅ Thành công', `Đã cập nhật hệ số cân: ${factor}`);
      } else {
        RNAlert.alert('Lỗi', json.message || 'Không gửi được lệnh');
      }
    } catch (e) {
      RNAlert.alert('Lỗi kết nối', 'Không thể kết nối backend');
    } finally {
      setIsSendingScale(false);
    }
  };

  const sendAutoCalibrate = async () => {
    const kg = parseFloat(knownWeight);
    if (isNaN(kg) || kg <= 0) {
      RNAlert.alert('Lỗi', 'Nhập khối lượng vật nặng dương hợp lệ');
      return;
    }
    RNAlert.alert(
      '🏗️ Xác nhận Auto-Calibration',
      `Đặt vật nặng ${kg}kg lên cân TRƯỚC rồi bấm Đồng ý`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý', onPress: async () => {
            setIsSendingScale(true);
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${API_URL}/barns/1/scale-calibration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ knownWeightKg: kg }),
              });
              RNAlert.alert('✅ Đã gửi lệnh', 'ESP32 đang tự tính hệ số...');
            } catch {
              RNAlert.alert('Lỗi', 'Không gửi được');
            } finally {
              setIsSendingScale(false);
            }
          },
        },
      ]
    );
  };

  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>([
    {
      id: 1,
      barnId: 1,
      barnName: 'Chuồng 01',
      time: '06:00',
      feedType: 'Thức ăn khởi động',
      quantity: 2.5,
      unit: 'kg',
      status: 'completed',
      notes: 'Gà ăn tốt, hết thức ăn'
    },
    {
      id: 2,
      barnId: 1,
      barnName: 'Chuồng 01',
      time: '10:00',
      feedType: 'Thức ăn chính',
      quantity: 3.0,
      unit: 'kg',
      status: 'pending'
    },
    {
      id: 3,
      barnId: 2,
      barnName: 'Chuồng 02',
      time: '06:00',
      feedType: 'Thức ăn khởi động',
      quantity: 2.8,
      unit: 'kg',
      status: 'completed'
    },
    {
      id: 4,
      barnId: 2,
      barnName: 'Chuồng 02',
      time: '10:00',
      feedType: 'Thức ăn chính',
      quantity: 3.2,
      unit: 'kg',
      status: 'pending'
    }
  ]);

  const feedTypes = [
    { id: 'starter', name: 'Thức ăn khởi động', age: '1-4 tuần' },
    { id: 'grower', name: 'Thức ăn tăng trưởng', age: '5-16 tuần' },
    { id: 'finisher', name: 'Thức ăn kết thúc', age: '>16 tuần' },
    { id: 'supplement', name: 'Thức ăn bổ sung', age: 'Tất cả' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'skipped': return COLORS.danger;
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'pending': return 'schedule';
      case 'skipped': return 'cancel';
      default: return 'help';
    }
  };

  const handleMarkComplete = (id: number) => {
    setFeedingSchedules(prev => 
      prev.map(schedule => 
        schedule.id === id 
          ? { ...schedule, status: 'completed' as const }
          : schedule
      )
    );
    RNAlert.alert('Thành công', 'Đã đánh dấu hoàn thành');
  };

  const handleSkip = (id: number) => {
    RNAlert.alert(
      'Bỏ qua lịch cho ăn',
      'Bạn có chắc chắn muốn bỏ qua lịch cho ăn này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Bỏ qua', 
          style: 'destructive',
          onPress: () => {
            setFeedingSchedules(prev => 
              prev.map(schedule => 
                schedule.id === id 
                  ? { ...schedule, status: 'skipped' as const }
                  : schedule
              )
            );
            RNAlert.alert('Thành công', 'Đã bỏ qua lịch cho ăn');
          }
        },
      ]
    );
  };

  const renderScheduleItem = ({ item }: { item: FeedingSchedule }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleInfo}>
          <Text style={styles.barnName}>{item.barnName}</Text>
          <Text style={styles.scheduleTime}>{item.time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Icon name={getStatusIcon(item.status)} size={16} color={COLORS.white} />
          <Text style={styles.statusText}>
            {item.status === 'completed' ? 'Hoàn thành' : 
             item.status === 'pending' ? 'Chờ thực hiện' : 'Bỏ qua'}
          </Text>
        </View>
      </View>
      
      <View style={styles.scheduleDetails}>
        <View style={styles.feedInfo}>
          <Text style={styles.feedType}>{item.feedType}</Text>
          <Text style={styles.feedQuantity}>
            {item.quantity} {item.unit}
          </Text>
        </View>
        
        {item.notes && (
          <Text style={styles.feedNotes}>Ghi chú: {item.notes}</Text>
        )}
      </View>
      
      {item.status === 'pending' && (
        <View style={styles.scheduleActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleMarkComplete(item.id)}
          >
            <Icon name="check" size={16} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Hoàn thành</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => handleSkip(item.id)}
          >
            <Icon name="close" size={16} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFeedTypeCard = (type: any) => (
    <TouchableOpacity key={type.id} style={styles.feedTypeCard}>
      <View style={styles.feedTypeHeader}>
        <Text style={styles.feedTypeName}>{type.name}</Text>
        <Text style={styles.feedTypeAge}>{type.age}</Text>
      </View>
      <View style={styles.feedTypeInfo}>
          <Text style={styles.feedTypeDescription}>
            {type.id === 'starter' && 'Chứa 20-22% protein, phù hợp cho gà con'}
            {type.id === 'grower' && 'Chứa 18-20% protein, giai đoạn tăng trưởng'}
            {type.id === 'finisher' && 'Chứa 16-18% protein, giai đoạn cuối'}
            {type.id === 'supplement' && 'Vitamin, khoáng chất, men tiêu hóa'}
          </Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cho ăn</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['schedule', 'history', 'settings'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab && styles.activeTabText
            ]}>
              {tab === 'schedule' ? 'Lịch cho ăn' :
               tab === 'history' ? 'Lịch sử' : 'Cài đặt'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.scrollView}>
        {selectedTab === 'schedule' && (
          <View style={[styles.section, { flex: 1, paddingBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Lịch cho ăn hôm nay</Text>
            <FlatList
              data={feedingSchedules}
              renderItem={renderScheduleItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {selectedTab === 'history' && (
          <ScrollView contentContainerStyle={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử cho ăn</Text>
            <Text style={styles.comingSoonText}>Tính năng đang phát triển...</Text>
          </ScrollView>
        )}

        {selectedTab === 'settings' && (
          <ScrollView contentContainerStyle={styles.section}>
            <Text style={styles.sectionTitle}>Loại thức ăn</Text>
            <View style={styles.feedTypesGrid}>
              {feedTypes.map(renderFeedTypeCard)}
            </View>

            {/* ── HIỆU CHỄNH CÂN HX711 ─────────────────────────── */}
            <View style={styles.settingsCard}>
              <View style={styles.settingsCardHeader}>
                <Icon name="scale" size={20} color={COLORS.primary} />
                <Text style={styles.settingsTitle}> Hiệu chỉnh cân (HX711)</Text>
              </View>

              {/* Cách 1: Đặt hệ số cân thủ công */}
              <Text style={styles.calibrateLabel}>Đặt hệ số cân trực tiếp</Text>
              <View style={styles.calibrateRow}>
                <TextInput
                  style={styles.calibrateInput}
                  value={scaleFactor}
                  onChangeText={setScaleFactor}
                  keyboardType="decimal-pad"
                  placeholder="Ví dụ: 2280"
                />
                <TouchableOpacity
                  style={[styles.calibrateBtn, isSendingScale && { opacity: 0.6 }]}
                  onPress={sendScaleFactor}
                  disabled={isSendingScale}
                >
                  {isSendingScale
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={styles.calibrateBtnText}>Áp dụng</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Cách 2: Auto-calibration */}
              <Text style={[styles.calibrateLabel, { marginTop: 12 }]}>Auto-calibration (khối lượng biết trước)</Text>
              <View style={styles.calibrateRow}>
                <TextInput
                  style={styles.calibrateInput}
                  value={knownWeight}
                  onChangeText={setKnownWeight}
                  keyboardType="decimal-pad"
                  placeholder="Ví dụ: 0.5 (kg)"
                />
                <TouchableOpacity
                  style={[styles.calibrateBtn, { backgroundColor: COLORS.warning }, isSendingScale && { opacity: 0.6 }]}
                  onPress={sendAutoCalibrate}
                  disabled={isSendingScale}
                >
                  <Text style={styles.calibrateBtnText}>Calibrate</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.calibrateHint}>
                💡 Đặt vật nặng đã biết lên cân trước khi bấm Calibrate
              </Text>
            </View>

            {/* ── CÀI ĐẶT CHO ĂN ─────────────────────────────────── */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>Cài đặt cho ăn tự động</Text>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Thời gian cho ăn mặc định</Text>
                <Text style={styles.settingValue}>06:00, 10:00, 14:00, 18:00</Text>
              </View>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Lượng thức ăn mặc định</Text>
                <Text style={styles.settingValue}>2.5 - 3.5 kg/chuồng</Text>
              </View>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Nhắc nhở</Text>
                <Text style={styles.settingValue}>15 phút trước khi cho ăn</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
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
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
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
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
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
    flex: 1,
  },
  barnName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '500',
  },
  scheduleDetails: {
    marginBottom: 12,
  },
  feedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedType: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  feedQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  feedNotes: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  skipButton: {
    backgroundColor: COLORS.danger,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
    marginLeft: 4,
  },
  feedTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  feedTypeCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedTypeHeader: {
    marginBottom: 8,
  },
  feedTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  feedTypeAge: {
    fontSize: 12,
    color: COLORS.gray,
  },
  feedTypeInfo: {
    marginTop: 8,
  },
  feedTypeDescription: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  comingSoonText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 40,
  },
  settingsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calibrateLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6,
    fontWeight: '500',
  },
  calibrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calibrateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.lightGray,
  },
  calibrateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  calibrateBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  calibrateHint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default FeedingScreen;
