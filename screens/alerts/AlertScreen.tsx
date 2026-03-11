import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/config';

const AlertScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const mockAlerts = [
    {
      id: 1,
      type: 'danger',
      title: 'Nhiệt độ cao',
      message: 'Chuồng 04 - Nhiệt độ vượt ngưỡng (38.5°C)',
      time: '5 phút trước',
      isRead: false,
      barnId: 4,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Mức nước thấp',
      message: 'Chuồng 02 - Mức nước dưới 20%',
      time: '15 phút trước',
      isRead: false,
      barnId: 2,
    },
    {
      id: 3,
      type: 'info',
      title: 'Đến lịch cho ăn',
      message: 'Chuồng 01 - Cho ăn theo lịch trình',
      time: '30 phút trước',
      isRead: true,
      barnId: 1,
    },
    {
      id: 4,
      type: 'success',
      title: 'Hoàn thành chu kỳ',
      message: 'Chuồng 03 - Gà đã đạt cân nặng mục tiêu',
      time: '1 giờ trước',
      isRead: true,
      barnId: 3,
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return { name: 'warning', color: COLORS.danger };
      case 'warning':
        return { name: 'error', color: COLORS.warning };
      case 'success':
        return { name: 'check-circle', color: COLORS.secondary };
      default:
        return { name: 'info', color: COLORS.primary };
    }
  };

  const handleAlertPress = (alert: any) => {
    RNAlert.alert(
      alert.title,
      alert.message,
      [
        { text: 'Xem chi tiết', onPress: () => console.log('View details') },
        { text: 'Đánh dấu đã đọc', onPress: () => console.log('Mark as read') },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const filteredAlerts = mockAlerts.filter(alert => 
    selectedFilter === 'all' || alert.type === selectedFilter
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cảnh báo</Text>
        <TouchableOpacity style={styles.clearButton}>
          <Icon name="clear-all" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'danger', 'warning', 'info', 'success'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter === 'all' ? 'Tất cả' : 
               filter === 'danger' ? 'Nguy hiểm' :
               filter === 'warning' ? 'Cảnh báo' :
               filter === 'info' ? 'Thông tin' : 'Thành công'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredAlerts.map((alert) => {
          const icon = getAlertIcon(alert.type);
          return (
            <TouchableOpacity
              key={alert.id}
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
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
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
        })}
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
    color: COLORS.text,
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
});

export default AlertScreen;
