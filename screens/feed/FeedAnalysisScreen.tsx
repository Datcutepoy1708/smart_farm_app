import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/config';

const { width } = Dimensions.get('window');

const FeedAnalysisScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedBarn, setSelectedBarn] = useState('all');

  const mockFeedData = {
    week: {
      totalFeed: 1250.5,
      averageDaily: 178.6,
      cost: 15750.0,
      efficiency: 1.8,
      trend: '+5.2%',
    },
    month: {
      totalFeed: 5200.0,
      averageDaily: 173.3,
      cost: 65000.0,
      efficiency: 1.75,
      trend: '+3.8%',
    },
  };

  const mockFeedLogs = [
    {
      id: 1,
      barnId: 1,
      barnName: 'Chuồng 01',
      date: '2024-03-12',
      time: '06:00',
      feedAmount: 50.0,
      feedType: 'Starter',
      cost: 625.0,
      birdsCount: 500,
      consumption: 95.5,
    },
    {
      id: 2,
      barnId: 2,
      barnName: 'Chuồng 02',
      date: '2024-03-12',
      time: '06:30',
      feedAmount: 45.0,
      feedType: 'Grower',
      cost: 562.5,
      birdsCount: 450,
      consumption: 92.3,
    },
    {
      id: 3,
      barnId: 3,
      barnName: 'Chuồng 03',
      date: '2024-03-12',
      time: '12:00',
      feedAmount: 48.0,
      feedType: 'Finisher',
      cost: 600.0,
      birdsCount: 480,
      consumption: 94.1,
    },
    {
      id: 4,
      barnId: 1,
      barnName: 'Chuồng 01',
      date: '2024-03-11',
      time: '18:00',
      feedAmount: 52.0,
      feedType: 'Starter',
      cost: 650.0,
      birdsCount: 500,
      consumption: 96.2,
    },
  ];

  const mockRecommendations = [
    {
      id: 1,
      title: 'Tối ưu lượng thức ăn',
      description: 'Giảm 10% thức ăn buổi sáng, tăng 5% buổi tối để cải thiện hiệu quả',
      potentialSaving: '1,250,000 VNĐ/tháng',
      priority: 'high',
      icon: 'trending-down',
    },
    {
      id: 2,
      title: 'Thay đổi loại thức ăn',
      description: 'Chuyển sang thức ăn cao cấp có thể giảm chi phí 15%',
      potentialSaving: '750,000 VNĐ/tháng',
      priority: 'medium',
      icon: 'swap-horiz',
    },
    {
      id: 3,
      title: 'Điều chỉnh lịch cho ăn',
      description: 'Tăng tần suất cho ăn từ 3 lên 4 lần/ngày',
      potentialSaving: '500,000 VNĐ/tháng',
      priority: 'low',
      icon: 'schedule',
    },
  ];

  const currentData = mockFeedData[selectedPeriod as keyof typeof mockFeedData];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return COLORS.danger;
      case 'medium':
        return COLORS.warning;
      default:
        return COLORS.secondary;
    }
  };

  const filteredLogs = mockFeedLogs.filter(log => 
    selectedBarn === 'all' || log.barnId.toString() === selectedBarn
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phân tích thức ăn</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Icon name="download" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        {['week', 'month'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodTab,
              selectedPeriod === period && styles.periodTabActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextActive,
              ]}
            >
              {period === 'week' ? 'Tuần này' : 'Tháng này'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="restaurant" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{currentData.totalFeed} kg</Text>
            <Text style={styles.statLabel}>Tổng thức ăn</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="today" size={24} color={COLORS.secondary} />
            <Text style={styles.statNumber}>{currentData.averageDaily} kg</Text>
            <Text style={styles.statLabel}>Trung bình/ngày</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="attach-money" size={24} color={COLORS.warning} />
            <Text style={styles.statNumber}>{currentData.cost.toLocaleString()}đ</Text>
            <Text style={styles.statLabel}>Chi phí</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="trending-up" size={24} color={COLORS.danger} />
            <Text style={styles.statNumber}>{currentData.efficiency}</Text>
            <Text style={styles.statLabel}>Hiệu suất (FCR)</Text>
          </View>
        </View>

        {/* Trend Card */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>Xu hướng</Text>
            <View style={styles.trendValue}>
              <Icon name="trending-up" size={16} color={COLORS.secondary} />
              <Text style={[styles.trendText, { color: COLORS.secondary }]}>
                {currentData.trend}
              </Text>
            </View>
          </View>
          <Text style={styles.trendDescription}>
            So với kỳ trước, tiêu thụ thức ăn tăng {currentData.trend}
          </Text>
        </View>

        {/* Barn Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', '1', '2', '3'].map((barn) => (
              <TouchableOpacity
                key={barn}
                style={[
                  styles.barnFilter,
                  selectedBarn === barn && styles.barnFilterActive,
                ]}
                onPress={() => setSelectedBarn(barn)}
              >
                <Text
                  style={[
                    styles.barnFilterText,
                    selectedBarn === barn && styles.barnFilterTextActive,
                  ]}
                >
                  {barn === 'all' ? 'Tất cả chuồng' : `Chuồng ${barn}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Feed Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử cho ăn</Text>
          {filteredLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logInfo}>
                  <Text style={styles.logBarn}>{log.barnName}</Text>
                  <Text style={styles.logDateTime}>
                    {log.date} lúc {log.time}
                  </Text>
                </View>
                <View style={styles.logAmount}>
                  <Text style={styles.amountText}>{log.feedAmount} kg</Text>
                  <Text style={styles.feedType}>{log.feedType}</Text>
                </View>
              </View>
              <View style={styles.logDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Chi phí:</Text>
                  <Text style={styles.detailValue}>{log.cost.toLocaleString()}đ</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Số lượng:</Text>
                  <Text style={styles.detailValue}>{log.birdsCount} con</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tiêu thụ:</Text>
                  <Text style={[styles.detailValue, { color: COLORS.secondary }]}>
                    {log.consumption}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đề xuất tối ưu</Text>
          {mockRecommendations.map((rec) => (
            <TouchableOpacity key={rec.id} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(rec.priority) }]} />
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Icon name="chevron-right" size={20} color={COLORS.gray} />
              </View>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>
              <View style={styles.savingContainer}>
                <Icon name="savings" size={16} color={COLORS.secondary} />
                <Text style={styles.savingText}>{rec.potentialSaving}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  exportButton: {
    padding: 8,
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  periodTabActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  periodTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  trendCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  trendValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  trendDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  barnFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  barnFilterActive: {
    backgroundColor: COLORS.primary,
  },
  barnFilterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  barnFilterTextActive: {
    color: COLORS.white,
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
  logCard: {
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  logBarn: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  logDateTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  logAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  feedType: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  recommendationCard: {
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  recommendationDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 20,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default FeedAnalysisScreen;
