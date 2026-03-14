import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';
import { feedApi } from '../../services/api';
// Assumes react-native-chart-kit is installed as per package.json
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const FeedAnalysisScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history'>('overview');
  
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  // Hardcode barnId = 1 temporarily as requested
  const barnId = 1;
  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Run calculate to ensure fresh recommendation, then fetch today & history
      await feedApi.calculate(barnId);
      
      const [todayRes, historyRes] = await Promise.all([
        feedApi.getToday(barnId),
        feedApi.getHistory(barnId, 7)
      ]);

      setTodayData(todayRes.data);
      // Reverse history so oldest is first for the chart left-to-right reading
      setHistoryData(historyRes.data.reverse());
    } catch (error) {
      console.error('Failed to fetch feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage < 90) return COLORS.warning;
    if (percentage > 110) return COLORS.danger;
    return COLORS.primary; // Healthy zone 90-110%
  };

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

  const renderProgressBar = () => {
    if (!todayData) return null;
    
    const { consumedGram, recommendedGram, percentage } = todayData;
    const isWarning = percentage < 90 || percentage > 110;
    const progressColor = getPercentageColor(percentage);
    
    // Cap visual progress at 100% so it doesn't overflow container visually
    const visualWidth = Math.min(percentage, 100);

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Tiến độ tiêu thụ hôm nay</Text>
          {isWarning && (
            <View style={[styles.badge, styles.badgeWarning]}>
              <Icon name="warning" size={12} color={COLORS.white} />
              <Text style={styles.badgeText}>
                {percentage < 90 ? 'Thiếu hụt' : 'Vượt mức'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${visualWidth}%`, backgroundColor: progressColor }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressText}>
            {(consumedGram / 1000).toFixed(2)} kg / {(recommendedGram / 1000).toFixed(2)} kg
          </Text>
          <Text style={[styles.progressPercentage, { color: progressColor }]}>
            {percentage}%
          </Text>
        </View>
      </View>
    );
  };

  const renderChart = () => {
    if (historyData.length === 0) return null;

    const labels = historyData.map(d => d.date.substring(5)); // just MM-DD
    const consumed = historyData.map(d => d.consumedGram / 1000); // map to kg

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Tiêu thụ 7 ngày qua (kg)</Text>
        <BarChart
          data={{
            labels,
            datasets: [{ data: consumed }]
          }}
          width={screenWidth - 64} // padding adjustment
          height={220}
          yAxisLabel=""
          yAxisSuffix=" kg"
          fromZero
          chartConfig={{
            backgroundColor: COLORS.white,
            backgroundGradientFrom: COLORS.white,
            backgroundGradientTo: COLORS.white,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // COLORS.primary roughly
            labelColor: (opacity = 1) => COLORS.gray,
            barPercentage: 0.6,
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{item.date}</Text>
        <View style={[styles.percentageBadge, { backgroundColor: getPercentageColor(item.percentage) }]}>
          <Text style={styles.percentageText}>{item.percentage}%</Text>
        </View>
      </View>
      
      <View style={styles.historyDetails}>
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Thực tế:</Text>
          <Text style={styles.historyValue}>{(item.consumedGram / 1000).toFixed(2)} kg</Text>
        </View>
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Khuyến nghị:</Text>
          <Text style={styles.historyValue}>{(item.recommendedGram / 1000).toFixed(2)} kg</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phân tích thức ăn</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
          <Icon name="refresh" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'history'].map((tab) => (
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
              {tab === 'overview' ? 'Tổng quan' : 'Lịch sử 7 ngày'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <View style={styles.scrollView}>
          {selectedTab === 'overview' && todayData && (
            <ScrollView contentContainerStyle={styles.section}>
              {renderProgressBar()}

              <Text style={styles.sectionTitle}>Thông tin đàn & dinh dưỡng</Text>
              <View style={styles.overviewGrid}>
                {renderOverviewCard(
                  'Giai đoạn',
                  todayData.stage.toUpperCase(),
                  'schedule',
                  COLORS.primary
                )}
                {renderOverviewCard(
                  'Protein',
                  todayData.nutrition?.proteinPct ? `${todayData.nutrition.proteinPct}%` : 'N/A',
                  'fitness-center',
                  COLORS.secondary
                )}
                {renderOverviewCard(
                  'Năng lượng',
                  todayData.nutrition?.energyKcalPerKg ? `${todayData.nutrition.energyKcalPerKg} kcal` : 'N/A',
                  'bolt',
                  COLORS.warning
                )}
                {renderOverviewCard(
                  'Khuyến nghị',
                  todayData.recommendedGram ? `${(todayData.recommendedGram/1000).toFixed(2)} kg` : '0 kg',
                  'restaurant',
                  COLORS.primary
                )}
              </View>
              
              {renderChart()}
            </ScrollView>
          )}

          {selectedTab === 'history' && (
            <View style={[styles.section, { flex: 1, paddingBottom: 0 }]}>
              <FlatList
                data={[...historyData].reverse()} // Show newest first in list
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.date}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      )}
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
  refreshButton: {
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
    marginTop: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.gray,
  },
  
  // Progress Bar Styles
  progressContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeWarning: {
    backgroundColor: COLORS.warning,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Overview Cards
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
    marginRight: 10,
  },
  overviewContent: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Chart
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
    alignSelf: 'flex-start',
    marginBottom: 16,
  },

  // History List
  listContainer: {
    paddingBottom: 16,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  historyDetails: {},
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
});

export default FeedAnalysisScreen;
