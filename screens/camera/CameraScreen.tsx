import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
// Giả định thư viện api và socket. Trong thực tế lấy từ config của project
// Nếu có thư viện khác (axios instance), vui lòng import vào.
// import api from '../../services/api';
// import { socket } from '../../services/socket';

const { width } = Dimensions.get('window');

// Thay bằng màu được yêu cầu
const COLORS = {
  primary: '#2D6A2D',
  secondary: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  white: '#FFFFFF',
  background: '#F5F5F5',
  gray: '#9E9E9E',
  lightGray: '#E0E0E0',
  darkGray: '#424242',
};

// -- INTERFACES --
export interface YoloDetection {
  id: number;
  barnId: number;
  chickenCount: number;
  abnormalCount: number;
  behaviors: {
    moving?: boolean;
    clustering?: boolean;
    eating?: boolean;
    reason?: string;
  } | null;
  confidenceAvg: number | null;
  imagePath: string | null;
  isAbnormal: boolean;
  recordedAt: string;
}

export interface DetectionStats {
  avgChickenCount: number;
  totalDetections: number;
  abnormalRate: number;
  maxAbnormalCount: number;
  hourlyData: {
    hour: string;
    chickenCount: number;
    isAbnormal: boolean;
  }[];
}

export interface DailyData {
  date: string;
  avgCount: number;
  abnormalCount: number;
  abnormalRate: number;
}

// -- MOCK DATA --
const MOCK_LATEST: YoloDetection = {
  id: 1,
  barnId: 1,
  chickenCount: 498,
  abnormalCount: 0,
  behaviors: { moving: true, clustering: false, eating: true },
  confidenceAvg: 94.5,
  imagePath: null,
  isAbnormal: false,
  recordedAt: new Date().toISOString(),
};

const MOCK_STATS: DetectionStats = {
  avgChickenCount: 497,
  totalDetections: 13,
  abnormalRate: 23,
  maxAbnormalCount: 8,
  hourlyData: [
    { hour: '06:00', chickenCount: 498, isAbnormal: false },
    { hour: '08:00', chickenCount: 495, isAbnormal: true },
    { hour: '10:00', chickenCount: 498, isAbnormal: false },
    { hour: '12:00', chickenCount: 497, isAbnormal: false },
  ],
};

const MOCK_DAILY: DailyData[] = [
  { date: '2026-03-28', avgCount: 498, abnormalCount: 0, abnormalRate: 0 },
  { date: '2026-03-29', avgCount: 497, abnormalCount: 2, abnormalRate: 5 },
  { date: '2026-03-30', avgCount: 495, abnormalCount: 8, abnormalRate: 15 },
  { date: '2026-03-31', avgCount: 498, abnormalCount: 0, abnormalRate: 0 },
  { date: '2026-04-01', avgCount: 496, abnormalCount: 4, abnormalRate: 10 },
  { date: '2026-04-02', avgCount: 498, abnormalCount: 0, abnormalRate: 0 },
  { date: '2026-04-03', avgCount: 497, abnormalCount: 8, abnormalRate: 23 },
];

const MOCK_HISTORY: YoloDetection[] = [
  MOCK_LATEST,
  {
    ...MOCK_LATEST,
    id: 2,
    chickenCount: 495,
    abnormalCount: 8,
    isAbnormal: true,
    behaviors: { moving: false, clustering: true, eating: false, reason: 'Nhiệt độ cao' },
    confidenceAvg: 91.2,
    recordedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

type TabType = 'LIVE' | 'ANALYTICS' | 'HISTORY';
type HistoryFilter = 'ALL' | 'ABNORMAL' | 'NORMAL';

export default function CameraScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('LIVE');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // States
  const [latestDetection, setLatestDetection] = useState<YoloDetection | null>(null);
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [history, setHistory] = useState<YoloDetection[]>([]);
  
  // Analytics State
  const [analyticsHours, setAnalyticsHours] = useState<number>(24);

  // History State
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
  const [selectedDetection, setSelectedDetection] = useState<YoloDetection | null>(null);

  const STREAM_URL = 'https://picsum.photos/seed/chickenfarm/400/300';
  const serverOnline = true; // Mock

  const fetchData = async () => {
    try {
      // Mock API calls (Thực tế gán gọi API)
      // fetchLatest();
      // fetchStats(analyticsHours);
      // fetchHistory();
      // fetchDailyData(7);
      
      setLatestDetection(MOCK_LATEST);
      setStats(MOCK_STATS);
      setHistory(MOCK_HISTORY);
      setDailyData(MOCK_DAILY);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Mock socket event (Thay bằng socket thật)
    /*
    socket.on('yolo:update', (data: {
      chickenCount: number;
      isAbnormal: boolean;
      abnormalCount: number;
      recordedAt: string;
    }) => {
      setLatestDetection(prev => prev ? {
        ...prev,
        chickenCount: data.chickenCount,
        isAbnormal: data.isAbnormal,
        abnormalCount: data.abnormalCount,
        recordedAt: data.recordedAt,
      } : null);
    });

    return () => {
      socket.off('yolo:update');
    };
    */
  }, []);

  useEffect(() => {
    // Khi đổi giờ thống kê, gọi lại API Stats
    if (!loading) {
      // fetchStats(analyticsHours);
      // tạm mô phỏng
    }
  }, [analyticsHours]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const sharedRefreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
  );

  // --- HELPER: Xác định trạng thái sức khỏe ---
  type HealthStatus = 'healthy' | 'weak' | 'dead' | 'unknown';

  const getHealthStatus = (detection: YoloDetection | null): HealthStatus => {
    if (!detection) return 'unknown';
    if (!detection.isAbnormal) return 'healthy';
    if (detection.abnormalCount < 10) return 'weak';
    return 'dead';
  };

  const healthConfig: Record<
    HealthStatus,
    { emoji: string; title: string; desc: string; bg: string; border: string; text: string }
  > = {
    healthy: {
      emoji: '🟢',
      title: 'ĐÀN GÀ KHỎE MẠNH',
      desc: 'Không phát hiện bất thường',
      bg: '#E8F5E9',
      border: '#4CAF50',
      text: '#2D6A2D',
    },
    weak: {
      emoji: '🟡',
      title: 'PHÁT HIỆN GÀ YẾU',
      desc: 'Quan sát thêm, kiểm tra sức khỏe đàn gà',
      bg: '#FFF3E0',
      border: '#FF9800',
      text: '#E65100',
    },
    dead: {
      emoji: '🔴',
      title: 'PHÁT HIỆN GÀ CHẾT',
      desc: 'Kiểm tra ngay và xử lý!',
      bg: '#FFEBEE',
      border: '#F44336',
      text: '#C62828',
    },
    unknown: {
      emoji: '⚪',
      title: 'CHƯA CÓ DỮ LIỆU',
      desc: 'Camera chưa gửi kết quả',
      bg: '#F5F5F5',
      border: '#BDBDBD',
      text: '#757575',
    },
  };

  const timeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `Hôm nay ${timeStr}`;
  };

  // --- RENDER LIVE TAB ---
  const renderLiveTab = () => {
    const status = getHealthStatus(latestDetection);
    const config = healthConfig[status];

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.liveTabContent}
        refreshControl={sharedRefreshControl}
      >
        {/* Header */}
        <View style={styles.cameraHeader}>
          <Text style={styles.cameraTitle}>📷 Camera AI</Text>
          <View style={styles.onlineBadge}>
            <View style={[styles.statusDot, { backgroundColor: serverOnline ? COLORS.secondary : COLORS.danger }]} />
            <Text style={styles.onlineText}>{serverOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        {/* Camera feed */}
        <View style={styles.cameraContainer}>
          <Image source={{ uri: STREAM_URL }} style={styles.cameraImage} resizeMode="cover" />
          <View style={styles.cameraOverlay}>
            <View style={styles.overlayTop}>
              <View style={styles.infoPill}>
                <Text style={styles.overlayText}>
                  🐔 {latestDetection?.chickenCount ?? '--'} con
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Tổng số gà */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>🐔 Tổng số gà:</Text>
          <Text style={styles.totalCount}>
            {latestDetection?.chickenCount ?? '--'} con
          </Text>
        </View>

        {/* Section title */}
        <Text style={styles.healthSectionTitle}>TÌNH TRẠNG SỨC KHỎE ĐÀN GÀ</Text>

        {/* Health status card */}
        <View
          style={[
            styles.healthStatusCard,
            {
              backgroundColor: config.bg,
              borderColor: config.border,
              borderWidth: 2,
            },
          ]}
        >
          <Text style={styles.healthEmoji}>{config.emoji}</Text>
          <Text style={[styles.healthTitle, { color: config.text }]}>{config.title}</Text>
          <Text style={[styles.healthDesc, { color: config.text }]}>{config.desc}</Text>
        </View>

        {/* Thời gian cập nhật */}
        <Text style={styles.updateTime}>
          🕐 Cập nhật:{' '}
          {latestDetection ? timeAgo(latestDetection.recordedAt) : 'Chưa có dữ liệu'}
        </Text>
      </ScrollView>
    );
  };

  // --- RENDER ANALYTICS TAB ---
  const renderAnalyticsTab = () => {
    if (!stats) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.analyticsHistoryContent} showsVerticalScrollIndicator={false} refreshControl={sharedRefreshControl}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[6, 12, 24, 168].map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.filterChip, analyticsHours === h && styles.filterChipActive]}
              onPress={() => setAnalyticsHours(h)}
            >
              <Text style={[styles.filterChipText, analyticsHours === h && styles.filterChipTextActive]}>
                {h === 168 ? '7 ngày' : `${h}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.statCardsGrid}>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>📊</Text>
            <Text style={styles.analyticsStatTitle}>Tổng</Text>
            <Text style={styles.analyticsStatValue}>{stats.totalDetections}</Text>
            <Text style={styles.analyticsStatSub}>lần quét</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>🐔</Text>
            <Text style={styles.analyticsStatTitle}>TB gà</Text>
            <Text style={styles.analyticsStatValue}>{stats.avgChickenCount.toFixed(1)}</Text>
            <Text style={styles.analyticsStatSub}>con</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>⚠️</Text>
            <Text style={styles.analyticsStatTitle}>B.Thường</Text>
            <Text style={[styles.analyticsStatValue, { color: COLORS.warning }]}>{stats.abnormalRate}%</Text>
            <Text style={styles.analyticsStatSub}>tỷ lệ</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>🔴</Text>
            <Text style={styles.analyticsStatTitle}>Max</Text>
            <Text style={[styles.analyticsStatValue, { color: COLORS.danger }]}>{stats.maxAbnormalCount}</Text>
            <Text style={styles.analyticsStatSub}>con</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Số lượng gà theo giờ</Text>
          {stats.hourlyData && stats.hourlyData.length > 0 && (
            <LineChart
              data={{
                labels: stats.hourlyData.map(h => h.hour.split(':')[0] + 'h'),
                datasets: [
                  {
                    data: stats.hourlyData.map(h => h.chickenCount),
                    color: () => COLORS.primary,
                  },
                ],
              }}
              width={width - 40}
              height={220}
              yAxisSuffix=""
              yAxisLabel=""
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(45, 106, 45, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: COLORS.primary,
                },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 8 }}
              getDotColor={(dataPoint, dataPointIndex) => 
                stats.hourlyData[dataPointIndex].isAbnormal ? COLORS.danger : COLORS.primary
              }
            />
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tỷ lệ bất thường (7 ngày)</Text>
          {dailyData && dailyData.length > 0 && (
            <BarChart
              data={{
                labels: dailyData.map(d => d.date.substring(8, 10) + '/' + d.date.substring(5, 7)),
                datasets: [
                  {
                    data: dailyData.map(d => d.abnormalRate),
                  },
                ],
              }}
              width={width - 40}
              height={220}
              yAxisSuffix="%"
              yAxisLabel=""
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Warning color
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
              }}
              style={{ marginVertical: 8, borderRadius: 8 }}
            />
          )}
        </View>
      </ScrollView>
    );
  };

  // --- RENDER HISTORY TAB ---
  const renderHistoryTab = () => {
    const filteredHistory = history.filter(item => {
      if (historyFilter === 'ALL') return true;
      if (historyFilter === 'ABNORMAL') return item.isAbnormal;
      if (historyFilter === 'NORMAL') return !item.isAbnormal;
      return true;
    });

    return (
      <View style={[styles.tabContent, styles.analyticsHistoryContent]}>
        <View style={styles.historyFilterRow}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ABNORMAL', label: 'Bất thường' },
            { id: 'NORMAL', label: 'Bình thường' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.historyFilterChip, historyFilter === tab.id && styles.historyFilterChipActive]}
              onPress={() => setHistoryFilter(tab.id as HistoryFilter)}
            >
              <Text style={[styles.historyFilterText, historyFilter === tab.id && styles.historyFilterTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredHistory}
          refreshControl={sharedRefreshControl}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isAb = item.isAbnormal;
            let behaviorText = 'Di chuyển bình thường';
            if (item.behaviors?.clustering) behaviorText = 'Đang tụm góc ⚠️';
            else if (item.behaviors?.eating === false) behaviorText = 'Không ăn uống ⚠️';

            return (
              <TouchableOpacity style={styles.historyCard} onPress={() => setSelectedDetection(item)}>
                <View style={styles.historyCardTop}>
                  <View style={styles.historyCardTitleRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: isAb ? COLORS.danger : COLORS.secondary }]} />
                    <Text style={styles.historyChickenCount}>{item.chickenCount} con</Text>
                  </View>
                  <Text style={styles.historyConf}>{item.confidenceAvg}%</Text>
                </View>
                
                <Text style={styles.historyBehaviorText}>{behaviorText}</Text>
                
                <View style={styles.historyCardBottom}>
                  <Text style={styles.historyTime}>
                    🕐 {new Date(item.recordedAt).toLocaleString('vi-VN')}
                  </Text>
                  {isAb && (
                    <View style={styles.historyAbnormalBadge}>
                      <Text style={styles.historyAbnormalBadgeText}>BẤT THƯỜNG</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER TABS */}
      <View style={styles.tabsContainer}>
        {[
          { id: 'LIVE', label: 'Trực tiếp' },
          { id: 'ANALYTICS', label: 'Phân tích' },
          { id: 'HISTORY', label: 'Lịch sử' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'LIVE' && renderLiveTab()}
          {activeTab === 'ANALYTICS' && renderAnalyticsTab()}
          {activeTab === 'HISTORY' && renderHistoryTab()}
        </View>
      )}

      {/* MODAL CHI TIẾT */}
      <Modal visible={!!selectedDetection} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết kiểm tra</Text>
            {selectedDetection && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Số gà đếm được:</Text>
                  <Text style={styles.modalValue}>{selectedDetection.chickenCount}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Gà bất thường:</Text>
                  <Text style={[styles.modalValue, { color: selectedDetection.abnormalCount > 0 ? COLORS.danger : COLORS.darkGray }]}>
                    {selectedDetection.abnormalCount} con
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Độ tin cậy:</Text>
                  <Text style={styles.modalValue}>{selectedDetection.confidenceAvg}%</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Thời gian:</Text>
                  <Text style={styles.modalValue}>{new Date(selectedDetection.recordedAt).toLocaleString('vi-VN')}</Text>
                </View>
                {selectedDetection.behaviors?.reason && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Lý do:</Text>
                    <Text style={[styles.modalValue, { color: COLORS.warning, fontWeight: 'bold' }]}>
                      {selectedDetection.behaviors.reason}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedDetection(null)}>
              <Text style={styles.modalCloseText}>ĐÓNG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// -- STYLES --
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    flex: 1,
  },
  liveTabContent: {
    paddingBottom: 24,
  },
  analyticsHistoryContent: {
    padding: 16,
  },
  
  // LIVE TAB
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  cameraContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  cameraImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    justifyContent: 'space-between',
  },
  overlayTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  infoPill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overlayText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.white,
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Tổng số gà row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  totalLabel: {
    fontSize: 15,
    color: COLORS.darkGray,
  },
  totalCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Health status section
  healthSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  healthStatusCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  healthEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  healthDesc: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
  },
  updateTime: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
    fontStyle: 'italic',
  },

  // ANALYTICS TAB
  filterScroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  statCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsStatCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  analyticsStatIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  analyticsStatTitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  analyticsStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  analyticsStatSub: {
    fontSize: 10,
    color: COLORS.gray,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.darkGray,
  },
  
  // HISTORY TAB
  historyFilterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 16,
    marginRight: 8,
  },
  historyFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  historyFilterText: {
    fontSize: 13,
    color: COLORS.darkGray,
  },
  historyFilterTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  historyChickenCount: {
    fontWeight: 'bold',
    fontSize: 15,
    color: COLORS.darkGray,
  },
  historyConf: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  historyBehaviorText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  historyCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  historyAbnormalBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  historyAbnormalBadgeText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    paddingBottom: 4,
  },
  modalLabel: {
    color: COLORS.gray,
    fontSize: 15,
  },
  modalValue: {
    fontWeight: '600',
    color: COLORS.darkGray,
    fontSize: 15,
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
