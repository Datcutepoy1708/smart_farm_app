import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';

interface FeedData {
  id: number;
  barnId: number;
  barnName: string;
  date: string;
  feedType: string;
  quantity: number;
  unit: string;
  cost: number;
  efficiency: number;
  notes?: string;
}

const FeedAnalysisScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'analysis'>('overview');
  const [feedData, setFeedData] = useState<FeedData[]>([
    {
      id: 1,
      barnId: 1,
      barnName: 'Chuồng 01',
      date: '2024-03-12',
      feedType: 'Thức ăn khởi động',
      quantity: 50,
      unit: 'kg',
      cost: 1500000,
      efficiency: 85,
      notes: 'Gà ăn tốt, tăng trưởng bình thường'
    },
    {
      id: 2,
      barnId: 2,
      barnName: 'Chuồng 02',
      date: '2024-03-12',
      feedType: 'Thức ăn chính',
      quantity: 60,
      unit: 'kg',
      cost: 1800000,
      efficiency: 78,
      notes: 'Cần theo dõi thêm về hiệu suất'
    },
  ]);
  const navigaiton=useNavigation();
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return COLORS.success;
    if (efficiency >= 75) return COLORS.warning;
    return COLORS.danger;
  };

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 85) return 'trending-up';
    if (efficiency >= 75) return 'trending-flat';
    return 'trending-down';
  };

  const totalQuantity = feedData.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = feedData.reduce((sum, item) => sum + item.cost, 0);
  const avgEfficiency = feedData.reduce((sum, item) => sum + item.efficiency, 0) / feedData.length;

  const renderFeedItem = ({ item }: { item: FeedData }) => (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.feedInfo}>
          <Text style={styles.barnName}>{item.barnName}</Text>
          <Text style={styles.feedDate}>{item.date}</Text>
        </View>
        <View style={[styles.efficiencyBadge, { backgroundColor: getEfficiencyColor(item.efficiency) }]}>
          <Icon name={getEfficiencyIcon(item.efficiency)} size={16} color={COLORS.white} />
          <Text style={styles.efficiencyText}>{item.efficiency}%</Text>
        </View>
      </View>
      
      <View style={styles.feedDetails}>
        <View style={styles.feedRow}>
          <Text style={styles.feedLabel}>Loại thức ăn:</Text>
          <Text style={styles.feedValue}>{item.feedType}</Text>
        </View>
        <View style={styles.feedRow}>
          <Text style={styles.feedLabel}>Số lượng:</Text>
          <Text style={styles.feedValue}>{item.quantity} {item.unit}</Text>
        </View>
        <View style={styles.feedRow}>
          <Text style={styles.feedLabel}>Chi phí:</Text>
          <Text style={styles.feedValue}>{item.cost.toLocaleString('vi-VN')} đ</Text>
        </View>
      </View>
      
      {item.notes && (
        <Text style={styles.feedNotes}>Ghi chú: {item.notes}</Text>
      )}
    </View>
  );

  const renderOverviewCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.overviewCard, { borderLeftColor: color }]}>
      <View style={styles.overviewIcon}>
        <Icon name={icon} size={32} color={color} />
      </View>
      <View style={styles.overviewContent}>
        <Text style={styles.overviewTitle}>{title}</Text>
        <Text style={styles.overviewValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigaiton.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phân tích thức ăn</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['overview', 'history', 'analysis'].map((tab) => (
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
              {tab === 'overview' ? 'Tổng quan' :
               tab === 'history' ? 'Lịch sử' : 'Phân tích'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.scrollView}>
        {selectedTab === 'overview' && (
          <ScrollView contentContainerStyle={styles.section}>
            <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                'Tổng lượng',
                `${totalQuantity} kg`,
                'scale',
                COLORS.primary
              )}
              {renderOverviewCard(
                'Tổng chi phí',
                `${totalCost.toLocaleString('vi-VN')} đ`,
                'payments',
                COLORS.warning
              )}
              {renderOverviewCard(
                'Hiệu suất TB',
                `${avgEfficiency.toFixed(1)}%`,
                'trending-up',
                getEfficiencyColor(avgEfficiency)
              )}
            </View>
            
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Biểu đồ hiệu suất</Text>
              <View style={styles.chartPlaceholder}>
                <Icon name="insert-chart" size={48} color={COLORS.gray} />
                <Text style={styles.chartText}>Biểu đồ đang phát triển...</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {selectedTab === 'history' && (
          <View style={[styles.section, { flex: 1, paddingBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Lịch sử cấp thức ăn</Text>
            <FlatList
              data={feedData}
              renderItem={renderFeedItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {selectedTab === 'analysis' && (
          <ScrollView contentContainerStyle={styles.section}>
            <Text style={styles.sectionTitle}>Phân tích chi tiết</Text>
            <View style={styles.analysisContainer}>
              <View style={styles.analysisCard}>
                <Text style={styles.analysisTitle}>Hiệu suất theo chuồng</Text>
                <View style={styles.analysisChart}>
                  <Text style={styles.analysisText}>Biểu đồ đang phát triển...</Text>
                </View>
              </View>
              
              <View style={styles.analysisCard}>
                <Text style={styles.analysisTitle}>Chi phí theo thời gian</Text>
                <View style={styles.analysisChart}>
                  <Text style={styles.analysisText}>Biểu đồ đang phát triển...</Text>
                </View>
              </View>
              
              <View style={styles.analysisCard}>
                <Text style={styles.analysisTitle}>Gợi ý tối ưu</Text>
                <View style={styles.suggestions}>
                  <Text style={styles.suggestionText}>• Giảm lượng thức ăn 5% cho chuồng 02</Text>
                  <Text style={styles.suggestionText}>• Tăng protein trong thức ăn khởi động</Text>
                  <Text style={styles.suggestionText}>• Theo dõi hiệu suất chuồng 01 kỹ hơn</Text>
                </View>
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
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  overviewIcon: {
    marginRight: 12,
  },
  overviewContent: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
  },
  listContainer: {
    paddingBottom: 16,
  },
  feedCard: {
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
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedInfo: {
    flex: 1,
  },
  barnName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  feedDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  efficiencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  efficiencyText: {
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '600',
  },
  feedDetails: {
    marginBottom: 12,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  feedValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  feedNotes: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  analysisContainer: {
    gap: 16,
  },
  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  analysisChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analysisText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  suggestions: {
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default FeedAnalysisScreen;
