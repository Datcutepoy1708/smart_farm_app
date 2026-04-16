import React, { useState, useEffect, useCallback } from 'react';
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
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

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

// -- INTERFACES (khớp với API Python trả về) --
export interface HistoryRecord {
  id: number;
  healthy: number;
  sick: number;
  dead: number;
  total: number;
  alert: boolean;
  image_url: string | null;
  timestamp: string;
}

export interface HourlyDataPoint {
  hour: string;
  avgTotal: number;
  avgHealthy: number;
  avgSick: number;
  avgDead: number;
  isAbnormal: boolean;
}

export interface DailyDataPoint {
  date: string;
  avgTotal: number;
  avgHealthy: number;
  avgSick: number;
  avgDead: number;
  alertCount: number;
  recordCount: number;
  abnormalRate: number;
}

export interface AnalyticsSummary {
  totalRecords: number;
  avgTotal: number;
  avgHealthy: number;
  avgSick: number;
  avgDead: number;
  abnormalRate: number;
  maxAbnormal: number;
  hours: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  hourlyData: HourlyDataPoint[];
  dailyData: DailyDataPoint[];
}

// Kết quả realtime từ /detect
export interface RealtimeDetection {
  khoe: number;
  benh: number;
  chet: number;
  total: number;
  healthy: number;
  sick: number;
  dead: number;
  alert: boolean;
  last_update: string | null;
  camera_status: string;
}

type TabType = 'LIVE' | 'ANALYTICS' | 'HISTORY';
type HistoryFilter = 'ALL' | 'ABNORMAL' | 'NORMAL';

// ===================================================
// Helper: fetch có timeout, tương thích React Native / Hermes
// (AbortSignal.timeout() KHÔNG chạy được trên Android RN)
// ===================================================
function fetchWithTimeout(url: string, timeoutMs: number = 6000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${url}`)), timeoutMs);
    fetch(url, { headers: { Accept: 'application/json' } })
      .then((res) => { clearTimeout(timer); resolve(res); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

export default function CameraScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('LIVE');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Realtime detection state
  const [realtimeData, setRealtimeData] = useState<RealtimeDetection | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<boolean>(false);

  // Analytics state
  const [analyticsHours, setAnalyticsHours] = useState<number>(24);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  // History state
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  // -- IP Python server --
  const PYTHON_SERVER_IP = 'http://10.109.201.205'; // ← Thay IP này nếu cần
  const STREAM_URL = `http://${PYTHON_SERVER_IP}:5000/video`;
  const BASE_URL   = `http://${PYTHON_SERVER_IP}:5000`;

  // ===================================================
  // FETCH REALTIME (Tab LIVE)
  // ===================================================
  const fetchRealtimeData = useCallback(async () => {
    try {
      const healthResp = await fetchWithTimeout(`${BASE_URL}/health`, 5000);
      const isOnline = healthResp.ok;
      setServerOnline(isOnline);

      if (!isOnline) {
        setRealtimeData(null);
        return;
      }

      const detectResp = await fetchWithTimeout(`${BASE_URL}/detect`, 5000);
      if (detectResp.ok) {
        const data: RealtimeDetection = await detectResp.json();
        setRealtimeData(data);
      }
    } catch (err) {
      console.warn('[Realtime] fetch error:', err);
      setServerOnline(false);
      setRealtimeData(null);
    }
  }, [BASE_URL]);

  // ===================================================
  // FETCH ANALYTICS (Tab ANALYTICS)
  // ===================================================
  const fetchAnalytics = useCallback(async (hours: number) => {
    setAnalyticsLoading(true);
    try {
      const resp = await fetchWithTimeout(`${BASE_URL}/api/analytics?hours=${hours}`, 8000);
      if (resp.ok) {
        const data: AnalyticsData = await resp.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.warn('[Analytics] fetch error:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [BASE_URL]);

  // ===================================================
  // FETCH HISTORY (Tab HISTORY)
  // ===================================================
  const fetchHistory = useCallback(async (filter: HistoryFilter) => {
    setHistoryLoading(true);
    try {
      const filterParam = filter === 'ALL' ? 'all' : filter === 'ABNORMAL' ? 'abnormal' : 'normal';
      const resp = await fetchWithTimeout(`${BASE_URL}/api/history?filter=${filterParam}&limit=50`, 8000);
      if (resp.ok) {
        const data: HistoryRecord[] = await resp.json();
        setHistory(data);
      }
    } catch (e) {
      console.warn('[History] fetch error:', e);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [BASE_URL]);

  // ===================================================
  // INITIAL LOAD
  // ===================================================
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRealtimeData();
      setLoading(false);
    };
    init();

    // Polling realtime moi 5 giay
    const interval = setInterval(fetchRealtimeData, 5000);
    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  // Load du lieu khi doi tab
  useEffect(() => {
    if (activeTab === 'ANALYTICS') {
      fetchAnalytics(analyticsHours);
    } else if (activeTab === 'HISTORY') {
      fetchHistory(historyFilter);
    }
  }, [activeTab]);

  // Khi doi khoang gio analytics
  useEffect(() => {
    if (activeTab === 'ANALYTICS') {
      fetchAnalytics(analyticsHours);
    }
  }, [analyticsHours]);

  // Khi doi filter lich su
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory(historyFilter);
    }
  }, [historyFilter]);

  // ===================================================
  // REFRESH HANDLER
  // ===================================================
  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'LIVE') {
      fetchRealtimeData().finally(() => setRefreshing(false));
    } else if (activeTab === 'ANALYTICS') {
      fetchAnalytics(analyticsHours).finally(() => setRefreshing(false));
    } else {
      fetchHistory(historyFilter).finally(() => setRefreshing(false));
    }
  };

  const sharedRefreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
  );

  // ===================================================
  // HELPERS
  // ===================================================
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

  const getHealthStatus = () => {
    if (!realtimeData) return 'unknown';
    if (!realtimeData.alert) return 'healthy';
    if (realtimeData.dead > 0) return 'dead';
    return 'weak';
  };

  type HealthStatus = 'healthy' | 'weak' | 'dead' | 'unknown';
  const healthConfig: Record<
    HealthStatus,
    { emoji: string; title: string; desc: string; bg: string; border: string; text: string }
  > = {
    healthy: {
      emoji: '🟢',
      title: 'ĐÀN GÀ KHỎE MẠNH',
      desc: 'Không phát hiện bất thường',
      bg: '#E8F5E9', border: '#4CAF50', text: '#2D6A2D',
    },
    weak: {
      emoji: '🟡',
      title: 'PHÁT HIỆN GÀ ỐM',
      desc: 'Quan sát thêm, kiểm tra sức khỏe đàn gà',
      bg: '#FFF3E0', border: '#FF9800', text: '#E65100',
    },
    dead: {
      emoji: '🔴',
      title: 'PHÁT HIỆN GÀ CHẾT',
      desc: 'Kiểm tra ngay và xử lý!',
      bg: '#FFEBEE', border: '#F44336', text: '#C62828',
    },
    unknown: {
      emoji: '⚪',
      title: 'CHƯA CÓ DỮ LIỆU',
      desc: 'Camera chưa gửi kết quả',
      bg: '#F5F5F5', border: '#BDBDBD', text: '#757575',
    },
  };

  // ===================================================
  // RENDER: LIVE TAB
  // ===================================================
  const renderLiveTab = () => {
    const status = getHealthStatus();
    const config = healthConfig[status];
    const total = realtimeData?.total ?? 0;

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
          {serverOnline && !cameraError ? (
            <>
              <WebView
                source={{
                  html: `<html><body style="margin:0;padding:0;background-color:black;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${STREAM_URL}" style="width:100%;height:100%;object-fit:cover;" onerror="window.ReactNativeWebView.postMessage('error');" /></body></html>`,
                  baseUrl: BASE_URL,
                }}
                onMessage={(event) => {
                  if (event.nativeEvent.data === 'error') setCameraError(true);
                }}
                style={styles.cameraImage}
                javaScriptEnabled={true}
                onError={() => setCameraError(true)}
                onHttpError={() => setCameraError(true)}
                scrollEnabled={false}
                bounces={false}
              />
              <TouchableOpacity style={styles.expandButton} onPress={() => setIsFullScreen(true)}>
                <Text style={styles.expandButtonText}>⛶ Phóng to</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.cameraImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }]}>
              <Text style={{ fontSize: 32 }}>{serverOnline ? '📷' : '📵'}</Text>
              <Text style={{ color: '#aaa', marginTop: 8, fontSize: 13 }}>
                {serverOnline ? 'Camera không phản hồi' : 'Server đang offline'}
              </Text>
              <TouchableOpacity
                style={{ marginTop: 12, backgroundColor: '#2D6A2D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                onPress={() => { setCameraError(false); fetchRealtimeData(); }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <View style={styles.overlayTop}>
              <View style={styles.infoPill}>
                <Text style={styles.overlayText}>🐔 {total} con</Text>
              </View>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Stats realtime */}
        {realtimeData && (
          <View style={styles.realtimeStatsRow}>
            <View style={[styles.realtimeStat, { borderLeftColor: COLORS.secondary }]}>
              <Text style={styles.realtimeStatNum}>{realtimeData.healthy}</Text>
              <Text style={styles.realtimeStatLabel}>🟢 Khỏe</Text>
            </View>
            <View style={[styles.realtimeStat, { borderLeftColor: COLORS.warning }]}>
              <Text style={styles.realtimeStatNum}>{realtimeData.sick}</Text>
              <Text style={styles.realtimeStatLabel}>🟡 Ốm</Text>
            </View>
            <View style={[styles.realtimeStat, { borderLeftColor: COLORS.danger }]}>
              <Text style={styles.realtimeStatNum}>{realtimeData.dead}</Text>
              <Text style={styles.realtimeStatLabel}>🔴 Chết</Text>
            </View>
          </View>
        )}

        {/* Tổng số gà */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>🐔 Tổng số gà:</Text>
          <Text style={styles.totalCount}>{total} con</Text>
        </View>

        {/* Section title */}
        <Text style={styles.healthSectionTitle}>TÌNH TRẠNG SỨC KHỎE ĐÀN GÀ</Text>

        {/* Health status card */}
        <View
          style={[
            styles.healthStatusCard,
            { backgroundColor: config.bg, borderColor: config.border, borderWidth: 2 },
          ]}
        >
          <Text style={styles.healthEmoji}>{config.emoji}</Text>
          <Text style={[styles.healthTitle, { color: config.text }]}>{config.title}</Text>
          <Text style={[styles.healthDesc, { color: config.text }]}>{config.desc}</Text>
        </View>

        {/* Thời gian cập nhật */}
        <Text style={styles.updateTime}>
          🕐 Cập nhật:{' '}
          {realtimeData?.last_update ? timeAgo(realtimeData.last_update) : 'Chưa có dữ liệu'}
        </Text>
      </ScrollView>
    );
  };

  // ===================================================
  // RENDER: ANALYTICS TAB
  // ===================================================
  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Đang tải dữ liệu phân tích...</Text>
        </View>
      );
    }

    if (!analyticsData || analyticsData.summary.totalRecords === 0) {
      return (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={styles.analyticsHistoryContent}
          refreshControl={sharedRefreshControl}
        >
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu phân tích</Text>
            <Text style={styles.emptyDesc}>
              Server cần chạy ít nhất vài phút để tích lũy dữ liệu.{'\n'}Kéo xuống để tải lại.
            </Text>
          </View>
        </ScrollView>
      );
    }

    const s = analyticsData.summary;
    const hourlyData = analyticsData.hourlyData;
    const dailyData  = analyticsData.dailyData;

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.analyticsHistoryContent}
        showsVerticalScrollIndicator={false}
        refreshControl={sharedRefreshControl}
      >
        {/* Filter giờ */}
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

        {/* Summary cards */}
        <View style={styles.statCardsGrid}>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>📊</Text>
            <Text style={styles.analyticsStatTitle}>Tổng quét</Text>
            <Text style={styles.analyticsStatValue}>{s.totalRecords}</Text>
            <Text style={styles.analyticsStatSub}>lần</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>🐔</Text>
            <Text style={styles.analyticsStatTitle}>TB gà</Text>
            <Text style={styles.analyticsStatValue}>{s.avgTotal}</Text>
            <Text style={styles.analyticsStatSub}>con</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>⚠️</Text>
            <Text style={styles.analyticsStatTitle}>Bất thường</Text>
            <Text style={[styles.analyticsStatValue, { color: COLORS.warning }]}>{s.abnormalRate}%</Text>
            <Text style={styles.analyticsStatSub}>tỷ lệ</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatIcon}>🔴</Text>
            <Text style={styles.analyticsStatTitle}>Max ốm/chết</Text>
            <Text style={[styles.analyticsStatValue, { color: COLORS.danger }]}>{s.maxAbnormal}</Text>
            <Text style={styles.analyticsStatSub}>con</Text>
          </View>
        </View>

        {/* Line chart: số gà theo giờ */}
        {hourlyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🐔 Số gà trung bình theo giờ</Text>
            <LineChart
              data={{
                labels: hourlyData.map(h => h.hour),
                datasets: [
                  {
                    data: hourlyData.map(h => h.avgTotal),
                    color: () => COLORS.primary,
                  },
                ],
              }}
              width={width - 56}
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
                propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 8 }}
              getDotColor={(_dataPoint, dataPointIndex) =>
                hourlyData[dataPointIndex]?.isAbnormal ? COLORS.danger : COLORS.primary
              }
            />
            <Text style={styles.chartNote}>● Đỏ = giờ có bất thường</Text>
          </View>
        )}

        {/* Bar chart: tỷ lệ bất thường 7 ngày */}
        {dailyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📅 Tỷ lệ bất thường (7 ngày)</Text>
            <BarChart
              data={{
                labels: dailyData.map(d => {
                  const parts = d.date.split('-');
                  return `${parts[2]}/${parts[1]}`;
                }),
                datasets: [{ data: dailyData.map(d => d.abnormalRate) }],
              }}
              width={width - 56}
              height={220}
              yAxisSuffix="%"
              yAxisLabel=""
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
              }}
              style={{ marginVertical: 8, borderRadius: 8 }}
            />
          </View>
        )}

        {/* Bar chart: số gà ốm/chết theo ngày */}
        {dailyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🟡 Gà ốm + chết trung bình theo ngày</Text>
            <BarChart
              data={{
                labels: dailyData.map(d => {
                  const parts = d.date.split('-');
                  return `${parts[2]}/${parts[1]}`;
                }),
                datasets: [{ data: dailyData.map(d => d.avgSick + d.avgDead) }],
              }}
              width={width - 56}
              height={200}
              yAxisSuffix=""
              yAxisLabel=""
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
              }}
              style={{ marginVertical: 8, borderRadius: 8 }}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  // ===================================================
  // RENDER: HISTORY TAB
  // ===================================================
  const renderHistoryTab = () => {
    if (historyLoading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Đang tải lịch sử...</Text>
        </View>
      );
    }

    if (history.length === 0) {
      return (
        <View style={[styles.tabContent, styles.analyticsHistoryContent]}>
          {/* Filter */}
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
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
            <Text style={styles.emptyDesc}>Kéo xuống để tải lại dữ liệu.</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.tabContent, styles.analyticsHistoryContent]}>
        {/* Filter */}
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
          data={history}
          refreshControl={sharedRefreshControl}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isAb = item.alert;
            return (
              <TouchableOpacity style={styles.historyCard} onPress={() => setSelectedRecord(item)}>
                <View style={styles.historyCardTop}>
                  <View style={styles.historyCardTitleRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: isAb ? COLORS.danger : COLORS.secondary }]} />
                    <Text style={styles.historyChickenCount}>{item.total} con</Text>
                  </View>
                  <View style={styles.historyRightBadge}>
                    {item.image_url && (
                      <View style={styles.snapBadge}>
                        <Text style={styles.snapBadgeText}>📷 Ảnh</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Chi tiet khoe/om/chet */}
                <View style={styles.historyDetailRow}>
                  <Text style={[styles.historyDetailItem, { color: COLORS.secondary }]}>
                    🟢 {item.healthy} khỏe
                  </Text>
                  <Text style={[styles.historyDetailItem, { color: COLORS.warning }]}>
                    🟡 {item.sick} ốm
                  </Text>
                  <Text style={[styles.historyDetailItem, { color: COLORS.danger }]}>
                    🔴 {item.dead} chết
                  </Text>
                </View>

                <View style={styles.historyCardBottom}>
                  <Text style={styles.historyTime}>
                    🕐 {new Date(item.timestamp).toLocaleString('vi-VN')}
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

  // ===================================================
  // MAIN RENDER
  // ===================================================
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
          {activeTab === 'LIVE'      && renderLiveTab()}
          {activeTab === 'ANALYTICS' && renderAnalyticsTab()}
          {activeTab === 'HISTORY'   && renderHistoryTab()}
        </View>
      )}

      {/* MODAL CHI TIẾT LỊCH SỬ (có ảnh snapshot) */}
      <Modal visible={!!selectedRecord} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết kiểm tra</Text>

            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ảnh snapshot nếu có */}
                {selectedRecord.image_url ? (
                  <View style={styles.snapshotContainer}>
                    <Image
                      source={{ uri: selectedRecord.image_url }}
                      style={styles.snapshotImage}
                      resizeMode="contain"
                    />
                    <View style={[styles.snapAlertBadge,
                      { backgroundColor: selectedRecord.alert ? '#FFEBEE' : '#E8F5E9' }]}>
                      <Text style={[styles.snapAlertText,
                        { color: selectedRecord.alert ? COLORS.danger : COLORS.primary }]}>
                        {selectedRecord.alert ? '⚠️ Phát hiện bất thường' : '✅ Bình thường'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noSnapshotBox}>
                    <Text style={styles.noSnapshotText}>📷 Không có ảnh (bản ghi bình thường)</Text>
                  </View>
                )}

                {/* Thông tin chi tiết */}
                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Tổng số gà:</Text>
                    <Text style={styles.modalValue}>{selectedRecord.total} con</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>🟢 Gà khỏe:</Text>
                    <Text style={[styles.modalValue, { color: COLORS.secondary }]}>
                      {selectedRecord.healthy} con
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>🟡 Gà ốm:</Text>
                    <Text style={[styles.modalValue, { color: selectedRecord.sick > 0 ? COLORS.warning : COLORS.darkGray }]}>
                      {selectedRecord.sick} con
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>🔴 Gà chết:</Text>
                    <Text style={[styles.modalValue, { color: selectedRecord.dead > 0 ? COLORS.danger : COLORS.darkGray }]}>
                      {selectedRecord.dead} con
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Thời gian:</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedRecord.timestamp).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedRecord(null)}>
              <Text style={styles.modalCloseText}>ĐÓNG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FULL SCREEN MODAL */}
      <Modal visible={isFullScreen} transparent={false} animationType="fade" onRequestClose={() => setIsFullScreen(false)}>
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={styles.closeFullScreenBtn} onPress={() => setIsFullScreen(false)}>
            <Text style={styles.closeFullScreenText}>✖ Đóng</Text>
          </TouchableOpacity>
          {serverOnline && (
            <WebView
              source={{
                html: `<html><body style="margin:0;padding:0;background-color:black;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${STREAM_URL}" style="width:100%;height:100%;object-fit:contain;" /></body></html>`,
                baseUrl: BASE_URL,
              }}
              style={{ flex: 1, backgroundColor: 'black' }}
              javaScriptEnabled={true}
              scrollEnabled={false}
              bounces={false}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===================================================
// STYLES
// ===================================================
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  centerText: {
    marginTop: 12,
    color: COLORS.gray,
    fontSize: 14,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
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
    paddingHorizontal: 16,
    paddingTop: 12,
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
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  cameraImage: {
    width: '100%',
    height: '100%',
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
  expandButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  expandButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Realtime stats row (3 ô nhỏ dưới camera)
  realtimeStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  realtimeStat: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 1,
  },
  realtimeStatNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  realtimeStatLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },

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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeFullScreenBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  closeFullScreenText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
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
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.darkGray,
  },
  chartNote: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
    fontStyle: 'italic',
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
  historyRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snapBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  snapBadgeText: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '600',
  },
  historyDetailRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  historyDetailItem: {
    fontSize: 13,
    fontWeight: '500',
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 48,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  // Snapshot trong modal
  snapshotContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  snapshotImage: {
    width: '100%',
    height: 220,
  },
  snapAlertBadge: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  snapAlertText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  noSnapshotBox: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  noSnapshotText: {
    color: COLORS.gray,
    fontSize: 13,
  },
  modalBody: {
    marginBottom: 16,
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  modalCloseText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
