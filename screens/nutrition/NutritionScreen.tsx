import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { feedApi } from '../../services/api';

interface NutritionData {
  stage: 'starter' | 'grower' | 'finisher';
  ageDays: number;
  chickenCount: number;
  avgWeightKg: number;
  recommendedFeedGram: number;
  recommendedWaterLiter: number;
  tempAdjustmentFactor: number;
  standard: {
    proteinPct: number;
    energyKcalPerKg: number;
    feedRatio: number;
    waterRatio: number;
  };
}

const COLORS = {
  primary: '#2D6A2D',
  secondary: '#4CAF50',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#F44336',
};

// Define Stage configuration for badges and table
const STAGES = [
  { id: 'starter', label: 'Starter', protein: 22, energy: 2900, feedRatio: 0.28 },
  { id: 'grower', label: 'Grower', protein: 20, energy: 3100, feedRatio: 0.22 },
  { id: 'finisher', label: 'Finisher', protein: 18, energy: 3200, feedRatio: 0.18 },
] as const;

export default function NutritionScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const barnId = 1; // Expected to be passed dynamically later

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await feedApi.calculate(barnId);
      // Assuming backend structure { success: true, data: NutritionData }
      let rawData = res.data?.data || res.data;
      if (rawData) {
         // Convert string numbers to actual numbers
         const formattedData: NutritionData = {
           ...rawData,
           ageDays: Number(rawData.ageDays),
           chickenCount: Number(rawData.chickenCount),
           avgWeightKg: Number(rawData.avgWeightKg),
           recommendedFeedGram: Number(rawData.recommendedFeedGram),
           recommendedWaterLiter: Number(rawData.recommendedWaterLiter),
           tempAdjustmentFactor: Number(rawData.tempAdjustmentFactor),
           standard: {
             ...rawData.standard,
             proteinPct: Number(rawData.standard.proteinPct),
             energyKcalPerKg: Number(rawData.standard.energyKcalPerKg),
             feedRatio: Number(rawData.standard.feedRatio),
             waterRatio: Number(rawData.standard.waterRatio),
           }
         };
         setData(formattedData);
      } else {
         setError('Không có dữ liệu.');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Nutrition:', err);
      setError('Không thể lấy chỉ số dinh dưỡng lúc này. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (label: string, valueStr: string, percentage: number) => {
    // Clamp between 0-100
    const clampedPct = Math.min(Math.max(percentage, 0), 100);
    
    return (
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValueText}>{valueStr}</Text>
        </View>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${clampedPct}%` }]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dinh dưỡng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tính toán khẩu phần...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dinh dưỡng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="warning-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'Không có dữ liệu.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNutritionData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dinh dưỡng</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{data.stage.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Card 1: Thông tin đàn gà */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin đàn gà</Text>
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Tuổi</Text>
              <Text style={styles.statValue}>{data.ageDays} ngày</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="list-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Số lượng</Text>
              <Text style={styles.statValue}>{data.chickenCount} con</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="barbell-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Cân nặng TB</Text>
              <Text style={styles.statValue}>{data.avgWeightKg} kg</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Khẩu phần khuyến nghị */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Khẩu phần hôm nay</Text>
          <View style={styles.rationRow}>
            <View style={styles.rationItem}>
              <Ionicons name="leaf" size={24} color="#FF9800" />
              <Text style={styles.rationLabel}>Thức ăn</Text>
              <Text style={styles.rationValue}>{(data.recommendedFeedGram / 1000).toFixed(2)}</Text>
              <Text style={styles.rationUnit}>kg/ngày</Text>
            </View>
            <View style={styles.rationItem}>
              <Ionicons name="water" size={24} color="#2196F3" />
              <Text style={styles.rationLabel}>Nước uống</Text>
              <Text style={styles.rationValue}>{data.recommendedWaterLiter.toFixed(1)}</Text>
              <Text style={styles.rationUnit}>lít/ngày</Text>
            </View>
          </View>
          <View style={styles.tempFactorContainer}>
            <Ionicons name="thermometer-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.tempFactorText}>
              Chỉ số điều chỉnh nhiệt độ: ×{data.tempAdjustmentFactor.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Card 3: Thành phần dinh dưỡng (Progress Bars) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiêu chuẩn ({data.stage.toUpperCase()})</Text>
          
          {renderProgressBar(
            'Protein', 
            `${data.standard.proteinPct}%`, 
            (data.standard.proteinPct / 30) * 100 // Visual scaling relative to a max arbitrary 30% mark for poultry
          )}
          
          {renderProgressBar(
            'Năng lượng', 
            `${data.standard.energyKcalPerKg} kcal/kg`, 
            (data.standard.energyKcalPerKg / 3500) * 100 // Scaled to max roughly 3500 kcal
          )}

          {renderProgressBar(
            'Tỷ lệ thức ăn', 
            `${data.standard.feedRatio.toFixed(2)} g/g`, 
            (data.standard.feedRatio / 0.4) * 100
          )}

          {renderProgressBar(
            'Tỷ lệ nước', 
            `${data.standard.waterRatio.toFixed(1)} L/con`, 
            (data.standard.waterRatio / 3) * 100
          )}
        </View>

        {/* Card 4: So sánh 3 giai đoạn (Table) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>So sánh tiêu chuẩn sinh trưởng</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.2 }]}>Chỉ số</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Starter</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Grower</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Finisher</Text>
            </View>

            {/* Protein Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { flex: 1.2 }]}>Protein</Text>
              {STAGES.map(s => (
                <Text key={`pro-${s.id}`} style={[styles.tableCell, data.stage === s.id && styles.activeCellText]}>
                  {s.protein}%
                </Text>
              ))}
            </View>

            {/* Energy Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { flex: 1.2 }]}>Năng lượng</Text>
              {STAGES.map(s => (
                <Text key={`eng-${s.id}`} style={[styles.tableCell, data.stage === s.id && styles.activeCellText]}>
                  {s.energy}
                </Text>
              ))}
            </View>

            {/* Feed Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { flex: 1.2 }]}>Tỷ lệ ăn</Text>
              {STAGES.map(s => (
                <Text key={`feed-${s.id}`} style={[styles.tableCell, data.stage === s.id && styles.activeCellText]}>
                  {s.feedRatio}
                </Text>
              ))}
            </View>
            
            {/* Highlighter overlay using flex positioning (Logical Simulation) */}
            <View style={styles.highlightRowBase}>
               {/* Spacer for label */}
               <View style={{flex: 1.2}} />
               {STAGES.map(s => (
                 <View key={`hl-${s.id}`} style={[styles.tableHighlightCol, data.stage === s.id && styles.activeHighlightCol]} />
               ))}
            </View>
          </View>
        </View>
        
      </ScrollView>
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
    color: COLORS.text,
  },
  badgeContainer: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  rationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  rationItem: {
    alignItems: 'center',
  },
  rationLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  rationValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  rationUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tempFactorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tempFactorText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  // Progress Bars
  progressRow: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  progressValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBackground: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeader: {
    backgroundColor: '#F0F7F0',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.text,
    zIndex: 1, // Stay above highlighter
  },
  tableCellHeader: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tableCellLabel: {
    textAlign: 'left',
    paddingLeft: 12,
    fontWeight: '500',
  },
  activeCellText: {
    fontWeight: 'bold',
    color: '#000',
  },
  highlightRowBase: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 0,
  },
  tableHighlightCol: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'transparent',
  },
  activeHighlightCol: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: COLORS.secondary,
    borderWidth: 2,
  },
  // Load/Error States
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
